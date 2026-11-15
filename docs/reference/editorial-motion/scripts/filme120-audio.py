"""Cached ElevenLabs narration and phrase/word timing for CadernaFilme120.

Run from toolkit root with uv run. --generate authorizes only missing takes;
without it the script assembles the existing cache. Speech is never accelerated.
"""
import argparse
import base64
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from config import get_elevenlabs_api_key, get_voice_id
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs

DATA = PROJECT / 'filme120'
AUDIO = PROJECT / 'public/audio/filme120'
CACHE = DATA / 'cache'


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf8')


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]))


def words_from_alignment(a):
    words, chars, start, end = [], '', None, 0
    for char, t0, t1 in zip(a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']):
        if char.isspace():
            if chars:
                words.append({'text': chars, 'start': start, 'end': end})
            chars, start = '', None
        else:
            if start is None:
                start = t0
            chars += char
            end = t1
    if chars:
        words.append({'text': chars, 'start': start, 'end': end})
    return words


def captions(words):
    # Choose short phrase boundaries, strongly avoiding stranded articles and
    # prepositions. Actual word timestamps remain the source of all intervals.
    weak = set('a o as os um uma de do da dos das e em no na nos nas para com ao aos que esse essa cada seu sua pode podem ajuda'.split())
    sentences, current = [], []
    for word in words:
        current.append(word)
        if word['text'].endswith(('.', '?', '!')):
            sentences.append(current)
            current = []
    if current:
        sentences.append(current)
    result = []
    for sentence in sentences:
        n = len(sentence)
        cost, choices = [float('inf')] * (n+1), [n] * n
        cost[n] = 0
        for i in range(n-1, -1, -1):
            for j in range(i+1, n+1):
                text = ' '.join(w['text'] for w in sentence[i:j])
                if len(text) > 56 or sentence[j-1]['end']-sentence[i]['start'] > 4.2:
                    break
                penalty = 3 + abs(len(text)-40)/30 + (30 if sentence[j-1]['text'].lower().strip(',.') in weak and j<n else 0) + (5 if j-i==1 and n>1 else 0)
                if penalty + cost[j] < cost[i]:
                    cost[i], choices[i] = penalty + cost[j], j
        i = 0
        while i<n:
            j = choices[i]
            group = sentence[i:j]
            text = ' '.join(w['text'] for w in group)
            text = text.replace('caderna ponto i a ponto b r.', 'caderna.ia.br.')
            result.append({'text': text, 'start': group[0]['start'], 'end': group[-1]['end']})
            i = j
    return result


def main():
    global DATA, AUDIO, CACHE
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true')
    parser.add_argument('--edition', choices=['filme120', 'concursos'], default='filme120')
    parser.add_argument('--recover-first', action='store_true', help='Recover the already generated first take from history without paying again')
    args = parser.parse_args()
    DATA = PROJECT / args.edition
    AUDIO = PROJECT / 'public/audio' / args.edition
    CACHE = DATA / 'cache'
    blocks = json.loads((DATA / 'roteiro.json').read_text(encoding='utf8'))
    config = json.loads((PROJECT / 'voz/voice.json').read_text(encoding='utf8'))
    performance_path = DATA / 'performance-v2.json'
    performance = json.loads(performance_path.read_text(encoding='utf8')) if performance_path.exists() else None
    if performance:
        config = {'model': performance['model'], 'settings': performance['settings']}
    settings = config['settings']
    voice = get_voice_id()
    if not voice:
        raise SystemExit('Missing configured ELEVENLABS_VOICE_ID; no voice substituted.')
    CACHE.mkdir(parents=True, exist_ok=True)
    AUDIO.mkdir(parents=True, exist_ok=True)
    client = None
    takes = []
    for i, b in enumerate(blocks):
        if performance:
            cached = performance['blocks'][i]
            assert cached['text'] == b['text'], 'Script changed after performance generation.'
            takes.append({**b, 'duration': cached['duration'], 'path': PROJECT/cached['path'], 'words': cached['words']})
            print(f"{b['id']}: expressive performance cache, natural tempo", flush=True)
            continue
        fingerprint = hashlib.sha256(json.dumps([b['text'], voice, config['model'], settings], sort_keys=True).encode()).hexdigest()
        base = CACHE / f"{b['id']}-{fingerprint[:12]}"
        mp3, meta = base.with_suffix('.mp3'), base.with_suffix('.json')
        if not (mp3.exists() and meta.exists()):
            if not args.generate:
                raise SystemExit(f"Missing cache for {b['id']}. Use --generate after reviewing roteiro.json.")
            key = get_elevenlabs_api_key()
            if not key:
                raise SystemExit('Missing ELEVENLABS_API_KEY; no provider substituted.')
            client = client or ElevenLabs(api_key=key)
            if args.recover_first and i == 0:
                recent = client.history.list(page_size=10, voice_id=voice).history
                match = next((h for h in recent if h.text == b['text'] and h.model_id == config['model']), None)
                if match is None:
                    raise SystemExit('Exact first take not found in history; no regeneration attempted.')
                item = client.history.get(match.history_item_id)
                alignment = item.alignments.normalized_alignment or item.alignments.alignment
                mp3.write_bytes(b''.join(client.history.get_audio(match.history_item_id)))
                dump(meta, {'fingerprint': fingerprint, 'model': config['model'], 'settings': settings, 'alignment': alignment.model_dump(), 'text': b['text'], 'recoveredFromHistory': True})
                print('First take recovered from history without regeneration.', flush=True)
                stored = json.loads(meta.read_text(encoding='utf8'))
                takes.append({**b, 'duration': duration(mp3), 'path': mp3, 'words': words_from_alignment(stored['alignment'])})
                continue
            print(f"Generating {b['id']} ({len(b['text'])} characters)", flush=True)
            try:
                response = client.text_to_speech.convert_with_timestamps(
                    voice_id=voice, text=b['text'], model_id=config['model'], language_code='pt',
                    output_format='mp3_44100_128',
                    voice_settings=VoiceSettings(stability=settings['stability'], similarity_boost=settings['similarityBoost'], style=settings['style'], speed=settings['speed'], use_speaker_boost=settings['useSpeakerBoost']),
                    previous_text=blocks[i-1]['text'] if i else None,
                    next_text=blocks[i+1]['text'] if i+1<len(blocks) else None,
                    request_options={'max_retries': 0},
                )
            except Exception as error:
                raise SystemExit(f"ElevenLabs failed for {b['id']}: {type(error).__name__}, HTTP {getattr(error, 'status_code', 'unknown')}. Prior cache retained.") from None
            mp3.write_bytes(base64.b64decode(response.audio_base_64))
            alignment = response.normalized_alignment or response.alignment
            if alignment is None:
                raise SystemExit(f"Audio saved for {b['id']} but alignment missing; inspect before generating again.")
            dump(meta, {'fingerprint': fingerprint, 'model': config['model'], 'settings': settings, 'alignment': alignment.model_dump(), 'text': b['text']})
        stored = json.loads(meta.read_text(encoding='utf8'))
        words = words_from_alignment(stored['alignment'])
        d = duration(mp3)
        takes.append({**b, 'duration': d, 'path': mp3, 'words': words})
        print(f"{b['id']}: {d:.3f}s, {len(b['text'].split())/d*60:.1f} wpm, cached", flush=True)

    # The configured voice speaks near 200 wpm. Slow the saved takes uniformly,
    # preserving pitch, instead of buying another complete set or speeding speech.
    tempo = 1 if performance else 0.82
    for take in takes:
        paced = AUDIO / f"{take['id']}.wav"
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(take['path']), '-af', f'atempo={tempo}', '-ar', '48000', '-ac', '1', str(paced)], check=True)
        take['rawDuration'] = take['duration']
        take['duration'] = duration(paced)
        take['path'] = paced
        take['words'] = [{**w, 'start': w['start']/tempo, 'end': w['end']/tempo} for w in take['words']]
    # Protect every utterance, a short lead, and at least 3 seconds of closing hold.
    minimum = [math.ceil(t['duration'] * 30) + (105 if i == 6 else 24) for i, t in enumerate(takes)]
    if sum(minimum) > 3600:
        raise SystemExit(f"Narration too long ({sum(minimum)/30:.2f}s with holds); revise only needed blocks. No audio was accelerated.")
    spare = 3600 - sum(minimum)
    weights = [max(0, b['budget'] * 30 - m) for b, m in zip(blocks, minimum)]
    if not sum(weights):
        weights = [1] * len(blocks)
    total_weight = sum(weights)
    allocations = [int(spare * w / total_weight) for w in weights]
    allocations[-1] += spare - sum(allocations)
    cursor, timeline, all_words = 0, [], []
    for take, min_frames, extra in zip(takes, minimum, allocations):
        frames = min_frames + extra
        offset = (cursor + 9) / 30
        ws = [{**w, 'start': round(w['start']+offset, 3), 'end': round(w['end']+offset, 3)} for w in take['words']]
        all_words.extend(ws)
        timeline.append({'id': take['id'], 'start': cursor, 'end': cursor+frames, 'audioStart': cursor+9, 'audioDuration': take['duration'], 'text': take['text'], 'words': ws})
        cursor += frames
    caps = captions(all_words)
    dump(PROJECT / f'src/{args.edition}-timing.json', {'fps': 30, 'durationInFrames': 3600, 'alignmentSource': 'ElevenLabs character alignment, natural performance' if performance else 'ElevenLabs normalized character alignment', 'blocks': timeline, 'captions': caps})
    dump(DATA / 'words.json', all_words)
    dump(DATA / 'captions.json', caps)
    dump(DATA / 'production.json', {'model': config['model'], 'settings': settings, 'words': sum(len(b['text'].split()) for b in blocks), 'rawSpeechSeconds': sum(t['rawDuration'] for t in takes), 'pacedSpeechSeconds': sum(t['duration'] for t in takes), 'durationSeconds': 120, 'paidTakes': performance.get('paidRequests', 1) if performance else len(takes), 'pitchPreservingTempo': tempo, 'accelerated': False, 'blocks': [{k:v for k,v in t.items() if k not in ('words','path')} for t in takes]})
    (DATA / 'ROTEIRO.md').write_text('# Locução CadernaFilme120\n\n' + '\n\n'.join(f"## {t['id']} | {t['start']/30:.2f} a {t['end']/30:.2f} s\n\n{t['text']}" for t in timeline) + '\n', encoding='utf8')
    def stamp(s):
        ms = round(s*1000)
        return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    (DATA / 'legendas.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(caps))+'\n', encoding='utf8')
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for t in takes:
        cmd += ['-i', str(t['path'])]
    filters = [f"[{i}:a]adelay={round(t['audioStart']/30*1000)}:all=1[a{i}]" for i,t in enumerate(timeline)]
    filters.append(''.join(f'[a{i}]' for i in range(len(takes)))+f"amix=inputs={len(takes)}:normalize=0,apad,atrim=duration=120[mix]")
    raw = DATA / 'narracao-mix.wav'
    subprocess.run(cmd + ['-filter_complex', ';'.join(filters), '-map', '[mix]', '-ar', '48000', '-ac', '1', str(raw)], check=True)
    analysis = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(raw), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True).stderr
    stats, _ = json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])
    dump(DATA / 'loudness-before.json', stats)
    norm = f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af',norm,'-ar','48000','-ac','1',str(AUDIO/'narracao.wav')],check=True)
    print(f"Timeline saved: {cursor} frames; final speech ends {all_words[-1]['end']:.2f}s; remaining CTA hold {120-all_words[-1]['end']:.2f}s.")


if __name__ == '__main__':
    main()

"""One expressive, continuous ElevenLabs take; cache it and split at phrase pauses.

Run with --generate once. Existing audio and exports are retained under revisions/v1.
No time stretching, synthetic speed change or paid music generation.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

P = Path(__file__).resolve().parents[1]
ROOT = P.parents[1]
sys.path.insert(0, str(ROOT/'tools'))
from config import get_elevenlabs_api_key, get_voice_id
from elevenlabs.client import ElevenLabs
from voiceover import generate_dialogue_audio

spec = importlib.util.spec_from_file_location('film_audio', P/'scripts/filme120-audio.py')
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)

parser = argparse.ArgumentParser()
parser.add_argument('--generate', action='store_true')
parser.add_argument('--patch-blocks', nargs='+', type=int)
parser.add_argument('--edition', choices=['filme120', 'concursos'], default='filme120')
args = parser.parse_args()
data = P/args.edition
(data/'cache').mkdir(parents=True, exist_ok=True)
backup = data/'revisions/v1'
for relative in ['src/filme120-timing.json','public/audio/filme120/narracao.wav','filme120/production.json','filme120/PRODUCAO.md','out/caderna-filme120-limpo.mp4','out/caderna-filme120-legendado.mp4']:
    source, target = P/relative, backup/relative
    if source.exists() and not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

blocks = json.loads((data/'roteiro.json').read_text(encoding='utf8'))
text = '\n\n'.join(b['text'] for b in blocks)
voice = get_voice_id()
if not voice:
    raise SystemExit('Configured voice missing; no replacement selected.')
settings = {'model':'eleven_v4','stability':0.35,'similarity':0.85}
if args.patch_blocks:
    manifest_path=data/'performance-v2.json'
    previous=json.loads(manifest_path.read_text(encoding='utf8'))
    saved=data/'revisions/performance-v2-before-hook.json'
    saved.parent.mkdir(parents=True, exist_ok=True)
    if not saved.exists():
        shutil.copy2(manifest_path,saved)
    new_requests=0
    for i in args.patch_blocks:
        b=blocks[i]
        digest=hashlib.sha256(json.dumps([b['text'],voice,settings],sort_keys=True).encode()).hexdigest()[:16]
        take=data/'cache'/f"{b['id']}-v2-revision-{digest}.mp3"
        meta=take.with_suffix('.json')
        if not (take.exists() and meta.exists()):
            if not args.generate:
                raise SystemExit(f"Missing replacement cache for {b['id']}")
            print(f"Generating only revised block {b['id']}",flush=True)
            result=generate_dialogue_audio(ElevenLabs(api_key=get_elevenlabs_api_key()),b['text'],voice,str(take),model=settings['model'],stability=settings['stability'],similarity=settings['similarity'],with_timestamps=True)
            audio.dump(meta,{**result,'text':b['text'],'settings':settings})
            new_requests+=1
        result=json.loads(meta.read_text(encoding='utf8'))
        a=result['alignment']
        words=audio.words_from_alignment({'characters':a['characters'],'character_start_times_seconds':a['starts'],'character_end_times_seconds':a['ends']})
        assert ''.join(w['text'] for w in words)==''.join(b['text'].split()), 'Replacement alignment mismatch'
        previous['blocks'][i]={'id':b['id'],'text':b['text'],'path':str(take.relative_to(P)).replace('\\','/'),'duration':audio.duration(take),'words':words}
    previous['revisedBlocks']=sorted(set(previous.get('revisedBlocks',[])+[blocks[i]['id'] for i in args.patch_blocks]))
    previous['paidRequests']=previous.get('paidRequests',1)+new_requests
    previous['sourceDuration']=sum(b['duration'] for b in previous['blocks'])
    audio.dump(manifest_path,previous)
    print('Revised blocks saved; other performance blocks reused unchanged.')
    raise SystemExit(0)
fingerprint = hashlib.sha256(json.dumps([text,voice,settings],sort_keys=True).encode()).hexdigest()[:16]
take = data/'cache'/f'performance-v2-{fingerprint}.mp3'
meta = take.with_suffix('.json')
if not (take.exists() and meta.exists()):
    if not args.generate:
        raise SystemExit('Missing expressive take. Review script and use --generate.')
    key = get_elevenlabs_api_key()
    if not key:
        raise SystemExit('ElevenLabs credential missing.')
    print('Generating one continuous expressive take with the configured voice.',flush=True)
    try:
        result = generate_dialogue_audio(ElevenLabs(api_key=key),text,voice,str(take),model=settings['model'],stability=settings['stability'],similarity=settings['similarity'],with_timestamps=True)
    except Exception as error:
        raise SystemExit(f'Generation failed: {type(error).__name__}; HTTP {getattr(error,"status_code","unknown")}. Inspect existing take before retry.') from None
    audio.dump(meta, {**result,'text':text,'settings':settings,'fingerprint':fingerprint})
stored = json.loads(meta.read_text(encoding='utf8'))
a = stored['alignment']
words = audio.words_from_alignment({'characters':a['characters'],'character_start_times_seconds':a['starts'],'character_end_times_seconds':a['ends']})
norm = lambda s: re.sub(r'[^\w]','',s.lower())
expected = text.split()
assert [norm(w['text']) for w in words] == [norm(w) for w in expected], 'Alignment text differs; inspect before splitting.'
full_duration = audio.duration(take)
ends, cursor = [], 0
for b in blocks:
    cursor += len(b['text'].split())
    ends.append(cursor)
bounds = [0] + [(words[i-1]['end']+words[i]['start'])/2 for i in ends[:-1]] + [full_duration]
manifest, cursor = [], 0
for i,b in enumerate(blocks):
    target = data/'cache'/f"{b['id']}-performance-v2-{fingerprint}.wav"
    begin,end = bounds[i:i+2]
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(take),'-ss',str(begin),'-t',str(end-begin),'-af','afade=t=in:d=0.005','-ar','48000','-ac','1',str(target)],check=True)
    selected = words[cursor:ends[i]]
    local = [{**w,'start':round(w['start']-begin,6),'end':round(w['end']-begin,6)} for w in selected]
    manifest.append({'id':b['id'],'text':b['text'],'path':str(target.relative_to(P)).replace('\\','/'),'duration':audio.duration(target),'words':local})
    cursor=ends[i]
audio.dump(data/'performance-v2.json',{'model':settings['model'],'settings':settings,'take':str(take.relative_to(P)).replace('\\','/'),'sourceDuration':full_duration,'tempo':1,'blocks':manifest})
print(f'Natural take: {full_duration:.2f}s. Block durations: '+', '.join(f"{b['duration']:.2f}" for b in manifest))

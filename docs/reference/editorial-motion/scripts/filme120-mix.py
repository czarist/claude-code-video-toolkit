"""Mix the natural narration with Caderna's existing 2-minute instrumental.

Only local processing. Keep dry voice and ducked music stems for review.
"""
import json
import argparse
import subprocess
from pathlib import Path

P=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--edition', choices=['filme120', 'concursos'], default='filme120')
args=parser.parse_args()
OUT=P/'public/audio'/args.edition
DATA=P/args.edition
music=P/'public/audio/music/caderna-2min_1.mp3'
voice=OUT/'narracao.wav'

def run(args):
    return subprocess.run(['ffmpeg','-hide_banner','-y',*args],capture_output=True,text=True,encoding='utf8',check=True)

def normalize(source,dest,target):
    stats=run(['-i',str(source),'-af',f'loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json','-f','null','-']).stderr
    stats,_=json.JSONDecoder().raw_decode(stats[stats.rfind('{'):])
    filt=f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
    run(['-i',str(source),'-af',filt,'-ar','48000',str(dest)])
    return stats

# The original track is 122s; retain its existing development and musical tail.
bed=DATA/'music-bed.wav'
run(['-ss','2','-i',str(music),'-t','120','-af','loudnorm=I=-22:TP=-3:LRA=9,afade=t=in:d=1.2,afade=t=out:st=117.4:d=2.6','-ar','48000','-ac','2',str(bed)])
duck=OUT/'musica-ducked.wav'
run(['-i',str(bed),'-i',str(voice),'-filter_complex','[0:a][1:a]sidechaincompress=threshold=0.05:ratio=3:attack=20:release=550:knee=3[duck]','-map','[duck]','-ar','48000',str(duck)])
premix=DATA/'mix-v2-premaster.wav'
run(['-i',str(voice),'-i',str(duck),'-filter_complex','[0:a]pan=stereo|c0=c0|c1=c0[v];[v][1:a]amix=inputs=2:normalize=0:duration=longest,atrim=duration=120[m]','-map','[m]','-ar','48000',str(premix)])
stats=normalize(premix,OUT/'mix.wav',-15)
final=run(['-i',str(OUT/'mix.wav'),'-af','loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json','-f','null','-']).stderr
final,_=json.JSONDecoder().raw_decode(final[final.rfind('{'):])
report={'music':'public/audio/music/caderna-2min_1.mp3','provenance':'Existing Caderna 2-minute production track, used in scripts/montar-2min.py','newPaidMusic':False,'voiceTempo':1,'musicTargetLufs':-22,'ducking':{'threshold':.05,'ratio':3,'attackMs':20,'releaseMs':550},'masterTargetLufs':-15,'measuredLufs':float(final['input_i']),'truePeak':float(final['input_tp']),'duration':120}
(DATA/'mix-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))

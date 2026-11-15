"""Independent, local recognition of the newly recorded campaign passages."""
import json
import subprocess
import numpy as np
from pathlib import Path
from faster_whisper import WhisperModel

p=Path(__file__).resolve().parents[1]
model=WhisperModel('small',device='cpu',compute_type='int8',local_files_only=True)
manifest=json.loads((p/'concursos/performance-v2.json').read_text(encoding='utf8'))
results=[]
for i in [0,1,5,6]:
    block=manifest['blocks'][i]
    pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(p/block['path']),'-ar','16000','-ac','1','-f','f32le','-'])
    segments,_=model.transcribe(np.frombuffer(pcm,dtype=np.float32),language='pt',beam_size=5,word_timestamps=True)
    recognized=' '.join(s.text.strip() for s in segments)
    results.append({'id':block['id'],'expected':block['text'],'recognized':recognized})
    print(block['id']+': '+recognized,flush=True)
(p/'concursos/asr-review.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')

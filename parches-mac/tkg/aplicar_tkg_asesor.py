"""tkg (22-nov-2026, Diego): Inicio del asesor tipo TikTok en el celular (una pantalla por publicación, se desliza hacia arriba).
Uso: python3 aplicar_tkg_asesor.py asesor.html carpeta_tkg   (idempotente: quita la versión anterior y pone la nueva)"""
import sys, re, os
p, d = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
css = open(os.path.join(d, 'tkg.css.html'), encoding='utf-8').read().strip()
js = open(os.path.join(d, 'tkg.js'), encoding='utf-8').read().strip()
s = re.sub(r'<style>/\* tkg: .*?</style>\n?', '', s, flags=re.S)
s = re.sub(r'/\* tkg: Inicio tipo TikTok gen.*?/\* /tkg \*/\n?', '', s, flags=re.S)
s = re.sub(r'\n  tkgMuro\(\);   /\* tkg \*/', '', s)
s = re.sub(r'function tkgMuro\(\)\{.*?\}   /\* tkg-muro \*/\n', '', s, flags=re.S)
M = '\n/* ================= MI META ================= */'
assert s.count(M) == 1
MURO = '''function tkgMuro(){ const m = sec('muro'), k = [...m.children], g = []; let i = 0;
  if (k[0] && !k[0].classList.contains('hist') && k[0].textContent.indexOf('🎂') >= 0) g.push([k[i++]]);
  g.push([k[i++], k[i++]]); g.push([k[i++]]); while (i < k.length) g.push([k[i++]]);
  tkgArmar(m, g, 'muro'); }   /* tkg-muro */
'''
s = s.replace(M, '\n' + js + '\n' + MURO + M)
A = "  document.querySelectorAll('[data-apl]').forEach(b => b.onclick = () => { const k = b.dataset.apl, y = k + ':yo'; E.aplausos[k] = (E.aplausos[k] || 0) + (E.aplausos[y] ? -1 : 1); E.aplausos[y] = !E.aplausos[y]; guardar(); renderMuro(); });"
assert s.count(A) == 1
s = s.replace(A, A + '\n  tkgMuro();   /* tkg */')
k = s.rindex('</body>'); s = s[:k] + css + '\n' + s[k:]
open(p, 'w', encoding='utf-8').write(s)
print('ok tkg', p)

"""
Ejecuta todos los archivos .http de la carpeta tests/ de una sola vez.

Uso (con el backend corriendo en http://localhost:8000):
    python tests/run_http.py              # resumen: solo muestra los fallos
    python tests/run_http.py -v           # muestra cada request
    python tests/run_http.py productos    # solo los archivos cuyo nombre contenga "productos"

Cada request se declara en el .http como:   ### Título (201)
El número entre paréntesis es el código HTTP esperado.
Soporta: variables de archivo (@base = ...), requests con nombre (# @name x),
referencias {{x.response.body.id}} / {{x.response.body.$[0].id}} y {{$timestamp}}.
Usa httpx, que ya se instala con fastapi[standard].
"""
import json
import re
import sys
import time
from pathlib import Path

import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REQUEST_LINE = re.compile(r"(GET|POST|PUT|PATCH|DELETE) ")
VAR_LINE = re.compile(r"@(\w+)\s*=\s*(.*)")


def valor_json(obj, expr):
    """Recorre un JSON con rutas tipo  a.b  o  $[0].id"""
    for parte in re.findall(r"\[\d+\]|[A-Za-z_]\w*", expr):
        obj = obj[int(parte[1:-1])] if parte.startswith("[") else obj[parte]
    return obj


def ejecutar_archivo(ruta: Path, verbose: bool) -> tuple[int, int]:
    texto = ruta.read_text(encoding="utf-8")
    cabecera, *bloques = re.split(r"\n###\s", "\n" + texto)
    variables: dict[str, str] = {}
    respuestas: dict[str, object] = {}

    for linea in cabecera.split("\n"):
        m = VAR_LINE.match(linea)
        if m:
            variables[m.group(1)] = m.group(2).strip()

    def resolver(s: str) -> str:
        s = s.replace("{{$timestamp}}", str(int(time.time())))

        def reemplazo(m):
            clave = m.group(1).strip()
            if clave in variables:
                return resolver(variables[clave])
            nombre, _, ruta_json = clave.partition(".response.body.")
            if ruta_json and nombre in respuestas:
                return str(valor_json(respuestas[nombre], ruta_json))
            raise KeyError(clave)

        return re.sub(r"\{\{([^}]+)\}\}", reemplazo, s)

    print(f"\n== {ruta.name} ==")
    ok = fallos = 0
    with httpx.Client(timeout=15) as cliente:
        for bloque in bloques:
            lineas = bloque.split("\n")
            titulo = lineas[0].strip()
            esperado = re.search(r"\((\d{3})\)", titulo)
            if not esperado:
                continue  # bloque sin código esperado (comentarios)
            esperado = int(esperado.group(1))

            nombre = None
            i = 1
            while i < len(lineas) and not REQUEST_LINE.match(lineas[i]):
                m = re.match(r"#\s*@name\s+(\w+)", lineas[i])
                if m:
                    nombre = m.group(1)
                i += 1
            if i >= len(lineas):
                continue

            metodo, url = lineas[i].split(" ", 1)
            cuerpo_lineas = [
                l for l in lineas[i + 1 :] if not l.startswith("#") and not VAR_LINE.match(l)
            ]
            cuerpo = "\n".join(cuerpo_lineas).strip()
            if cuerpo.startswith("Content-Type"):
                cuerpo = cuerpo.split("\n", 1)[1] if "\n" in cuerpo else ""

            try:
                datos = json.loads(resolver(cuerpo)) if cuerpo.strip() else None
                resp = cliente.request(metodo, resolver(url.strip()), json=datos)
            except KeyError as e:
                fallos += 1
                print(f"  FALLO  {titulo}\n         variable sin resolver: {e}")
                continue
            except httpx.HTTPError as e:
                print(f"\nNo se pudo conectar con el backend: {e}")
                print("¿Está corriendo?  ->  fastapi dev app/main.py")
                sys.exit(2)

            try:
                cuerpo_resp = resp.json()
            except ValueError:
                cuerpo_resp = None
            if nombre:
                respuestas[nombre] = cuerpo_resp

            if resp.status_code == esperado:
                ok += 1
                if verbose:
                    print(f"  ok     [{resp.status_code}] {titulo}")
            else:
                fallos += 1
                print(f"  FALLO  {titulo}")
                print(f"         esperado {esperado}, recibido {resp.status_code}: {resp.text[:200]}")
    return ok, fallos


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    verbose = "-v" in sys.argv
    carpeta = Path(__file__).parent
    archivos = sorted(carpeta.glob("*.http"))
    if args:
        archivos = [a for a in archivos if any(f in a.name for f in args)]
    if not archivos:
        print("No se encontraron archivos .http")
        sys.exit(1)

    total_ok = total_fallos = 0
    for archivo in archivos:
        ok, fallos = ejecutar_archivo(archivo, verbose)
        total_ok += ok
        total_fallos += fallos

    print(f"\nTOTAL: {total_ok} correctos, {total_fallos} con fallo, {total_ok + total_fallos} requests")
    sys.exit(1 if total_fallos else 0)


if __name__ == "__main__":
    main()

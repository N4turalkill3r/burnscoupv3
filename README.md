# BurnScope · Calculadora de Parkland para paciente quemado

PWA (móvil) y página web para calcular la reanimación hídrica del paciente quemado a partir de la
superficie corporal quemada (SCQ), que se obtiene **pintando las quemaduras en un modelo 3D** del
cuerpo. Entrega el plan de infusión, la diuresis esperada con semáforo y las recomendaciones del
protocolo SEM El Salvador (ABLS 2023).

> Herramienta de apoyo. No sustituye el criterio médico ni el protocolo vigente.

La memoria completa del proyecto (reglas clínicas, decisiones y pendientes) está en [`CLAUDE.md`](CLAUDE.md).

## Empezar

```bash
npm install
npm start          # servidor de desarrollo (http://localhost:5173), accesible desde el móvil en la red
npm test           # pruebas unitarias (Vitest)
npm run typecheck  # tipos (TypeScript)
npm run lint       # ESLint
npm run build      # build de producción + service worker (carpeta dist/)
npm run preview    # sirve dist/ para probar la PWA y el modo sin conexión
```

Requiere Node 20 o superior.

### Con Live Server de VS Code

Live Server sólo sirve archivos estáticos: **no puede ejecutar el código fuente** (`src/*.tsx`), por
eso abrir `index.html` de la raíz se ve en blanco. Hay que servir la carpeta compilada `dist/`:

1. `npm install` y `npm run build:fast` (genera `dist/`; el proyecto ya incluye una `dist/` lista).
2. Clic derecho en `dist/index.html` → **Open with Live Server** (o el botón _Go Live_).
   `.vscode/settings.json` ya fija `liveServer.settings.root` en `/dist`.
3. Tras cada cambio en `src/`, vuelve a ejecutar `npm run build:fast`.

Para desarrollar con recarga instantánea usa `npm start` (o la tarea _npm start_ de VS Code).

### Historial de pacientes

Los casos se guardan solos en el dispositivo (localStorage) en cuanto tienen edad y peso válidos, se
pueden abrir, borrar, exportar e importar (.json) desde el botón **Historial**. Nada se envía a un
servidor y los datos no van cifrados. El almacenamiento está detrás de la interfaz
`HistoryRepository` (`src/features/history/repository.ts`): para usar IndexedDB o un servidor basta
con otra implementación.

## Estructura

```
src/
├─ app/                   # arranque, estado global (store.ts) y hook useAssessment
├─ data/                  # DATOS CLÍNICOS editables, sin lógica ni UI
│  ├─ lundBrowder.ts      #   tabla de Lund-Browder
│  ├─ ruleOfNines.ts      #   regla de los nueve (adulto y pediátrica)
│  ├─ thresholds.ts       #   umbrales de SCQ por edad
│  ├─ fluidProtocol.ts    #   constantes de Parkland, bloques de 8/16 h, diuresis
│  ├─ zones.ts            #   nombres de zonas y su relación con los segmentos 3D
│  ├─ depths.ts           #   grados de quemadura y colores
│  ├─ findings.ts         #   hallazgos clínicos que se pueden marcar
│  └─ recommendationRules.ts  # recomendaciones del protocolo (una regla = un objeto)
├─ features/
│  ├─ burn-calculation/   # lógica pura: edad→modelo, SCQ, Parkland, mantenimiento, umbrales
│  ├─ diuresis/           # meta de diuresis y semáforo (lógica) + tarjeta de diuresis
│  ├─ recommendations/    # motor de reglas, criterios de derivación y su pantalla
│  ├─ body-model/         # modelo 3D por código, pintado, pincel y lista de zonas
│  ├─ history/            # historial: registro, validación, repositorio, autoguardado y pantalla
│  ├─ patient/            # pasos "Paciente" y "Horas"
│  ├─ findings/           # paso "Hallazgos"
│  └─ results/            # paso "Resultados" y resumen para copiar
├─ shared/                # componentes, utilidades y tipos compartidos
└─ styles/global.css
tests/                    # pruebas de la lógica clínica y utilidades
docs/protocolo/           # PDF del protocolo y tabla de Lund-Browder (referencia)
```

Regla de oro: **la lógica clínica (`data/` y `features/*/*.ts` sin `.tsx`) no importa nada de React**.
Así se prueba sola y se puede reutilizar.

## Cómo modificar

| Quiero…                                                  | Edito                                                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cambiar un valor de Lund-Browder                         | `src/data/lundBrowder.ts` (la prueba verifica que cada columna sume 100 %)       |
| Cambiar umbrales de SCQ o edades                         | `src/data/thresholds.ts`                                                         |
| Cambiar constantes, horas de bloques o metas de diuresis | `src/data/fluidProtocol.ts`                                                      |
| Agregar o cambiar una recomendación                      | `src/data/recommendationRules.ts`                                                |
| Agregar un hallazgo marcable                             | `src/data/findings.ts` y usarlo en una regla                                     |
| Cambiar los grupos de edad de los modelos                | `src/features/burn-calculation/age.ts` y `src/features/body-model/bodyLayout.ts` |
| Ajustar proporciones o forma del cuerpo 3D               | `src/features/body-model/bodyLayout.ts`                                          |
| Cambiar colores de los grados de quemadura               | `src/data/depths.ts`                                                             |
| Cambiar colores, tamaños o modo oscuro                   | `src/styles/global.css`                                                          |
| Cambiar nombre o íconos de la PWA                        | `vite.config.ts` y `public/icons/`                                               |

Después de cambiar datos o lógica clínica, ejecuta `npm test`.

## Modelo 3D

Se genera por código (no usa archivos externos): cada segmento del cuerpo es una malla de
`bodyLayout.ts` asociada a una zona de Lund-Browder y a un bloque de la regla de los nueve. El cuerpo
mira hacia +Z; el lado derecho del paciente queda en −X. En «Pintar» el dedo o el cursor marca
zonas; en «Girar» mueve la cámara. La lista de zonas es la alternativa accesible al modelo.

## Despliegue en GitHub Pages

Pages no puede ejecutar el código fuente: la raíz del repositorio (`index.html` apunta a
`/src/main.tsx`) se ve en blanco o da 404. Hay que publicar la carpeta compilada `dist/`, y de eso se
encarga `.github/workflows/deploy.yml`:

1. Sube el proyecto a GitHub (rama `main` o `master`), incluida la carpeta `.github/`.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada `git push` compila y publica solo (pestaña **Actions** para ver el progreso). La dirección
   queda en `https://<usuario>.github.io/<repositorio>/`.
4. Desde el celular abre esa dirección con HTTPS y usa _Instalar app_ / _Añadir a pantalla de inicio_.

El build usa rutas relativas (`base: './'`), así que funciona en la subcarpeta `/<repositorio>/` sin
configurar nada. Si cambias de versión y el celular muestra la anterior, cierra y abre la app una vez
(el service worker se actualiza solo).

### Alternativa sin Actions (la más simple)

La carpeta `docs/` ya contiene la app compilada. En GitHub: **Settings → Pages → Source: Deploy from
a branch → Branch `main` (o `master`) / carpeta `/docs`**. Tras cambiar `src/`, ejecuta
`npm run build:pages`, y sube los cambios con `git push`.

Cualquier otro hosting estático con HTTPS sirve igual: publica el contenido de `dist/`.

# Memoria del proyecto: BurnScope · Calculadora de Parkland para pacientes quemados

## 1. Objetivo
Crear una **PWA móvil** y **página web** (misma base de código) que calcule la fórmula de Parkland para pacientes quemados a partir de la **superficie corporal quemada (SCQ / %TBSA)**, obtenida al **pintar las zonas quemadas sobre un modelo 3D del cuerpo humano**. Además, la app entrega **recomendaciones clínicas basadas en el protocolo del SEM** (PDF aportado por el usuario) y **retroalimentación sobre la diuresis** con código de colores.

## 2. Estado actual
- FASE: **v0.2 (BurnScope)**: v0.1 + historial de pacientes, marca BurnScope y compatibilidad con Live Server. Base v0.1 completa y funcional (lógica clínica, modelo 3D por código, pintado, resultados, diuresis, recomendaciones y PWA con modo sin conexión). Ver README.md para ejecutar y modificar.
- Fuente clínica principal: PDF "Taller de manejo, reanimación y traslado del paciente quemado en el entorno prehospitalario" (SEM El Salvador, marco ABLS 2023 / ISBI). **Versión final.** Las anotaciones/resaltados y el comentario "Ventury ????" del PDF son notas del usuario: **ignorarlos**.
- El **Excel** no es obligatorio; el PDF basta para los cálculos. Solo se usará si el usuario lo envía con diseño o casos de prueba.
- Tabla de Lund-Browder: la del PDF estaba incompleta (faltaba tronco posterior); **la tabla correcta es la de la sección 6** (imagen aportada por el usuario).

## 3. Requisitos funcionales
1. **Datos del paciente**: tipo (adulto / pediátrico), edad, peso, tipo de quemadura (térmica/química, eléctrica de alto voltaje).
2. **Hora de la quemadura y hora de llegada del equipo médico** (las ingresa el usuario) para el ajuste por retraso.
3. **Modelo 3D según paciente**: un modelo adulto y modelos pediátricos por grupo de edad (ver sección 6). La división anatómica mostrada depende del método elegido.
4. **El usuario elige el método de estimación de SCQ** (puede cambiarlo):
   - **Lund-Browder** (por regiones, columna según edad) — propuesto por defecto.
   - **Regla de los nueve** (simplificada): adulto, o pediátrica modificada.
   - En regla de los nueve el usuario puede **usar la regla de la palma (1 %) o marcar el bloque completo** (p. ej. un bloque de 9 %). El modelo 3D muestra la **división anatómica correspondiente** al método y a la edad.
5. **Pintado** de quemaduras en el modelo 3D por zonas, separando profundidad (2.º y 3.er grado cuentan para SCQ; **1.er grado se pinta pero NO suma**).
6. **Dosis**: la app propone la constante según protocolo (2, 3 o 4 ml/kg/%SCQ) y el paramédico puede **aceptarla o escribir otro número** (campo editable) si por alguna razón cambia la dosis.
7. **Resultados**: volumen 24 h, reparto 8 h / 16 h con ajuste por retraso, velocidades en ml/h, mantenimiento basal pediátrico, **diuresis esperada**, y **recomendaciones del protocolo**.
8. **Control de diuresis**: el usuario ingresa la diuresis real del paciente y la app indica con color:
   - 🔴 Rojo: "La diuresis es muy baja" (por debajo de la meta).
   - 🟢 Verde: "La diuresis es correcta, vas por buen camino".
   - 🟡 Amarillo: "Estás sobrehidratando al paciente" (diuresis mayor a la esperada).
   - Con la conducta del protocolo (sección 7.6).
9. **Paciente sin modelo de cálculo**: si el tipo de paciente (o su edad) no existe dentro de ningún modelo definido, la app **no debe calcular ni asumir un modelo**; debe **pedirle al usuario que cambie al modelo de su preferencia** (mostrando los modelos disponibles).
10. Funcionamiento **offline** (PWA instalable) y responsive móvil/escritorio.

### Flujo de pantallas
Datos del paciente → horas (quemadura y llegada) → método de SCQ y modelo 3D → pintar → %SCQ → preferencia de dosis → resultados y recomendaciones → ingreso de diuresis y semáforo.

## 4. Requisitos no funcionales
- Editable y escalable desde **VS Code**.
- Código **dividido en carpetas y archivos por bloque de responsabilidad**, con buenas prácticas (separación de capas, nombres claros, tipado, pruebas).
- La lógica clínica debe estar **aislada de la UI** y cubierta por **pruebas unitarias** (usar los ejemplos del PDF: Holliday-Segar 8, 15 y 25 kg; atajo peso+40).
- Datos clínicos (tablas Lund-Browder, umbrales, constantes, reglas de recomendaciones) en **archivos de datos/configuración**, no incrustados en componentes.

## 5. Stack (confirmado por el usuario)
- TypeScript + Vite + React
- Three.js (vía React Three Fiber) para el modelo 3D y pintado por zonas
- vite-plugin-pwa (service worker, manifest, offline)
- Vitest para pruebas; ESLint + Prettier
- Modelos 3D en formato glTF/GLB

### Estructura de carpetas propuesta
```
/
├─ CLAUDE.md
├─ docs/
│  ├─ protocolo/            # PDF del protocolo y su transcripción estructurada
│  └─ calculos/             # Excel de referencia (si se aporta)
├─ public/
│  ├─ models/               # .glb adulto y pediátricos por edad
│  └─ icons/                # íconos PWA
├─ src/
│  ├─ app/                  # arranque, rutas, providers
│  ├─ features/
│  │  ├─ patient/           # tipo de paciente, edad, peso, horas
│  │  ├─ body-model/        # visor 3D, pintado, mapeo de zonas
│  │  ├─ burn-calculation/  # SCQ (Lund-Browder / reglas) y Parkland (lógica pura)
│  │  ├─ diuresis/          # meta de diuresis y semáforo
│  │  └─ recommendations/   # motor de recomendaciones del protocolo
│  ├─ data/                 # Lund-Browder, umbrales, constantes, reglas
│  ├─ shared/               # componentes UI, hooks, utilidades, tipos
│  └─ styles/
├─ tests/
└─ configuración (vite, tsconfig, eslint, pwa manifest)
```

## 6. Modelos corporales y tablas de SCQ

### Grupos de edad de los modelos (alineados a Lund-Browder)
Nac.–1 año | 1–4 años | 5–9 años | 10–14 años | Adulto (desde 15 años).
- **Edad 14 años = paciente pediátrico** (modelo 10–14 años, umbral SCQ >15 %); **desde los 15 años = adulto**.
- **Confirmado**: a los 15 años se usa la columna "15 años" de Lund-Browder y desde los 16 la de "adulto".
- **Confirmado**: edad de 1 año exacta usa la columna "Nac.–1 año" (el PDF original la rotulaba "1 año"); "1–4" se aplica de 2 a 4 años.
- **Los modelos 3D los generamos nosotros** (el usuario no tiene archivos): se crearán por código, segmentados por zonas anatómicas, escalados por grupo de edad y exportables a GLB.

### Tabla de Lund-Browder (% de superficie corporal; cada fila suma 100 %)
| Área | Nac.-1a | 1-4 | 5-9 | 10-14 | 15 | Adulto |
|---|---|---|---|---|---|---|
| Cabeza | 19 | 17 | 13 | 11 | 9 | 7 |
| Cuello | 2 | 2 | 2 | 2 | 2 | 2 |
| Tronco anterior | 13 | 13 | 13 | 13 | 13 | 13 |
| Tronco posterior | 13 | 13 | 13 | 13 | 13 | 13 |
| Glúteo der. | 2.5 | 2.5 | 2.5 | 2.5 | 2.5 | 2.5 |
| Glúteo izq. | 2.5 | 2.5 | 2.5 | 2.5 | 2.5 | 2.5 |
| Genitales | 1 | 1 | 1 | 1 | 1 | 1 |
| Antebrazo der. / izq. (c/u) | 4 | 4 | 4 | 4 | 4 | 4 |
| Brazo der. / izq. (c/u) | 3 | 3 | 3 | 3 | 3 | 3 |
| Mano der. / izq. (c/u) | 2.5 | 2.5 | 2.5 | 2.5 | 2.5 | 2.5 |
| Muslo der. / izq. (c/u) | 5.5 | 6.5 | 8 | 8.5 | 9 | 9.5 |
| Pierna der. / izq. (c/u) | 5 | 5 | 5.5 | 6 | 6.5 | 7 |
| Pie der. / izq. (c/u) | 3.5 | 3.5 | 3.5 | 3.5 | 3.5 | 3.5 |

### Regla de los nueve (simplificada)
- **Adulto/adolescente**: cabeza y cuello 9; tronco anterior 18 (tórax 9, abdomen 9); tronco posterior 18 (dorso superior 9, lumbosacra 9); cada miembro superior 9; cada miembro inferior 18; periné y genitales 1.
- **Pediátrica modificada**: cabeza y cuello 18; cada pierna 14; tronco y brazos igual que adulto. Nota del protocolo: por cada año >1 se resta 1 % a la cabeza y se suma 0.5 % a cada pierna hasta llegar al adulto (a los 14 años). **Decisión del usuario: usar la nota del PDF** (no la Fig. 2.2), aplicándola con topes de adulto (cabeza no menor de 9 %, pierna no mayor de 18 %). Lund-Browder queda como método alternativo. Ojo: la nota por sí sola no cuadra exactamente con los valores de adulto, por eso los topes; probar que la suma se mantenga en torno a 100 %.
- **Regla de la palma**: palma + dedos extendidos del paciente = 1 % (para quemaduras pequeñas o dispersas).

## 7. Reglas clínicas del protocolo (fuente: PDF)

### 7.1 Umbrales de SCQ para reanimación hídrica masiva (SIRS)
| Grupo | Edad | Umbral SCQ |
|---|---|---|
| Niños menores de 3 años | < 3 (no incluye 3) | > 5 % |
| Niños 3 a 10 años | 3 a 10 (incluye ambos) | > 10 % |
| Niños 10 a 14 años | > 10 hasta 14 (no incluye 10) | > 15 % |
| Adultos | ≥ 15 años (> 14) | > 20 % |
| Adultos mayores | ≥ 65 años (según PDF) | > 10 % |

### 7.2 Fluidoterapia inicial pre-cálculo (Ringer Lactato; si se ve lesión severa >20 % SCQ)
≤5 años: 125 ml/h · 6 a 12 años: 250 ml/h · ≥13 años y adultos: 500 ml/h.

### 7.3 Fórmula de reanimación (Ringer Lactato, 24 h desde la hora exacta del incidente)
Volumen 24 h = constante × peso (kg) × %SCQ (solo 2.º y 3.er grado).
- Adultos y adolescentes (≥14 años, como dice el PDF), térmica/química: **2 ml**.
- Pediátricos (<14 años), térmica/química: **3 ml**.
- Eléctrica de alto voltaje (todas las edades): **4 ml**.
- Estas son las constantes propuestas por defecto; el usuario puede escribir otra (rango del protocolo 2–4 ml).
- Un paciente de 14 años se clasifica como pediátrico (modelo, umbral SCQ) pero la constante de la fórmula es la del PDF (≥14 años → 2 ml). Mantenimiento basal (7.4): el PDF lo pide solo en <14 años, pero por **decisión del usuario se incluye también a los 14 años**; en pantalla y resultados debe mostrarse la nota: "Criterio especial fuera de protocolo (mantenimiento basal a los 14 años)".
- **50 % en las primeras 8 h** post-incidente y **50 % en las siguientes 16 h**.
- **Ajuste por retraso** (tiempo transcurrido t = hora de llegada − hora de la quemadura):
  - Si t < 8 h: el primer 50 % se infunde en las (8 − t) h restantes del bloque (ej.: llega a las 3 h → pasa en 5 h); el segundo 50 % en 16 h.
  - Si t ≥ 8 h: se administra el **100 % del volumen en las horas restantes hasta completar las 24 h** desde la quemadura (velocidad = volumen total / (24 − t)).
  - Si t ≥ 24 h: fuera de protocolo; mostrar aviso.

### 7.4 Mantenimiento basal pediátrico (simultáneo, Holliday-Segar 4-2-1)
Dextrosa 5 % en Ringer Lactato (o SS 0.45 %): 4 ml/kg/h primeros 10 kg + 2 ml/kg/h kg 11–20 + 1 ml/kg/h por kg sobre 20.
Atajo si peso >20 kg: peso + 40 = ml/h. Ejemplos: 8 kg → 32; 15 kg → 50; 25 kg → 65; 35 kg → 75 ml/h.

### 7.5 Metas de diuresis
- Adultos (térmica/química): **0.5 ml/kg/h** (≈30–50 ml/h).
- Pediátricos peso <30 kg: **1.0 ml/kg/h**; adolescentes >30 kg: meta de adulto (0.5 ml/kg/h). **El peso decide la meta.**
- Eléctrica con orina pigmentada (mioglobinuria): adultos **1.0–1.5 ml/kg/h**; niños **1.5–2.0 ml/kg/h** hasta que la orina aclare (usar constante de 4 ml).

### 7.6 Conducta según diuresis
- Por debajo de la meta en una hora → **aumentar la velocidad del Ringer Lactato 20–25 %**.
- Muy por encima de la meta → **disminuir la velocidad** (riesgo de edema pulmonar o síndrome compartimental).
- Semáforo (diuresis real vs meta, ml/kg/h): 🔴 rojo = por debajo de la meta; 🟢 verde = de 1.0 a 1.5 veces la meta; 🟡 amarillo = más de 1.5 veces la meta (sobre-hidratación). En eléctrica con mioglobinuria el verde es el rango propio (adultos 1.0–1.5; niños 1.5–2.0 ml/kg/h).

### 7.7 Recomendaciones (motor de reglas, por categorías)
- **ABCDE**: criterios de intubación temprana (estridor, disfonía, dificultad respiratoria, quemadura circunferencial profunda de cuello, edema faríngeo, Glasgow ≤8); O2 15 L/min al 100 % con reservorio; 2 vías ≥16G o acceso intraóseo tras 2 intentos fallidos; Foley; retirar anillos, relojes, etc.; cubrir con sábanas limpias y secas; prevenir hipotermia (T° >36.0 °C); **prohibido** agua fría/hielo/compresas húmedas, cremas, ungüentos o colorantes.
- **Pediatría**: glucemia capilar (cada hora en traslado largo; si <70 mg/dL ajustar dextrosa); temperatura axilar cada 5–15 min; criterios de intubación pediátrica.
- **Eléctrica**: EKG continuo, descartar mioglobinuria, constante 4 ml.
- **Química**: remover polvo seco antes del agua; irrigar 20–30 min ácidos y ≥60 min álcalis; irrigación ocular continua; **no** neutralizantes.
- **Inhalación/CO/HCN**: O2 100 % (SpO2 engañosa en CO); sospecha de cianuro en espacios cerrados.
- **Criterios de derivación a Unidad de Quemados** (cualquiera): 2.º grado >10 % SCQ; cara, manos, pies, genitales, periné o articulaciones mayores; 3.er grado de cualquier extensión; eléctrica o rayo; química por ácidos/álcalis potentes; inhalación; comorbilidades sistémicas (diabetes, IRC, cardiopatías); trauma concomitante severo (estabilizar primero si hay riesgo vital inmediato); pediátrico sin recursos calificados; quemaduras circunferenciales en extremidades, tórax o cuello.
- **Registro durante el transporte**: cada 15 min (cada 5 min en críticos): PA, PAM, FC (100–120 esperado en SIRS; <100 = bradicardia relativa), FR, temperatura, ECG, pulsos distales, llenado capilar, volumen infundido, velocidad de infusión, diuresis horaria.

## 8. Reglas de trabajo para Claude
- No inventar datos clínicos: todo debe provenir del PDF/Excel del usuario o de lo que él indique. Si falta información, **preguntar**.
- Mostrar siempre una advertencia: herramienta de apoyo, no sustituye el criterio médico ni el protocolo.
- Lógica de cálculo como funciones puras y testeables; datos clínicos en archivos de datos.
- Registrar cada decisión relevante en este archivo.
- Responder al usuario en **español**.

## 9. Decisiones registradas
- (v0.1) La regla de los nueve pediátrica con la nota del PDF suma 101 % entre 1 y 9 años (el 1 % de periné se cuenta aparte) y 100 % desde los 10 años; está documentado en `ruleOfNines.ts` y probado.
- (v0.1) Edades en años cumplidos (entero). Cada método de SCQ guarda sus propias marcas. (Reemplazado en v0.2: ahora hay historial local.)
- (v0.1) Si el usuario elige a mano un modelo distinto al de su edad, dosis, umbrales y metas siguen usando la edad real; sólo cambian modelo 3D y tabla de superficie.
- (v0.1) Cada zona admite una sola profundidad con una fracción marcada (completa, ¾, ½, ¼ o palmas en la regla de los nueve).
- Se usa el PDF como fuente de verdad; el Excel es opcional.
- Tabla de Lund-Browder corregida (100 % por columna) tomada de la imagen del usuario.
- El usuario elige el método de SCQ (Lund-Browder o regla de los nueve); en regla de los nueve se permite palma (1 %) o bloque completo.
- Si no existe modelo para el paciente: pedir al usuario que elija otro modelo.
- Ajuste por retraso con hora de quemadura y hora de llegada ingresadas por el usuario.
- Semáforo de diuresis: rojo / verde / amarillo.
- Peso decide la meta de diuresis pediátrica (<30 kg → 1.0 ml/kg/h).
- Umbrales de SCQ definidos por el usuario (sección 7.1); adultos mayores ≥65 años según PDF.
- 14 años = pediátrico; adulto desde 15 años; fórmula de adulto (2 ml) desde 14 años como dice el PDF.
- Dosis: constante por defecto + campo editable para escribir otro valor.
- Semáforo de diuresis: verde de 1.0 a 1.5 veces la meta; amarillo por encima de 1.5 veces.
- Retraso ≥8 h: 100 % del volumen en las horas restantes hasta completar 24 h desde la quemadura.
- Regla de los nueve pediátrica: nota del PDF con topes de adulto.
- Los modelos 3D se generan por código dentro del proyecto.
- Mantenimiento basal Holliday-Segar se incluye hasta los 14 años, con nota de "criterio especial fuera de protocolo".
- Columna "15 años" de Lund-Browder a los 15 años; adulto desde los 16. 1 año exacto → "Nac.–1 año".
- Stack confirmado: TypeScript + Vite + React + Three.js (R3F) + vite-plugin-pwa + Vitest.

- (v0.2) Nombre de la app: **BurnScope**; logo: lupa en llamas con destellos (el usuario escribió "glimbling", interpretado como "glimmering"). Íconos generados con `scripts/make-icons.py`; el logo en `Logo.tsx` debe mantenerse igual a `public/icons/icon.svg`.
- (v0.2) **Historial de pacientes** guardado en localStorage del dispositivo (clave `burnscope.history.v1`), autoguardado con espera de 600 ms cuando hay edad y peso válidos; datos validados al leer/importar; exportar/importar JSON. Sustituye la decisión de v0.1 de no guardar datos. Interfaz `HistoryRepository` para cambiar el almacenamiento. Aviso: sin cifrar.
- (v0.2) El nombre del paciente es opcional. Las lecturas de diuresis se pueden registrar y quedan en el caso y en el resumen.
- (v0.2) Live Server: sólo sirve estáticos, así que se sirve `dist/` (build con `base: './'`, `liveServer.settings.root: "/dist"`). Se entrega `dist/` ya compilada.
- (v0.2.1) GitHub Pages: `dist/` está en .gitignore, por eso Pages (que sirve archivos del repo) mostraba el código fuente sin compilar. Solución: workflow `.github/workflows/deploy.yml` que compila y despliega con GitHub Actions (Settings → Pages → Source: GitHub Actions). Sin cambios en la app.
- (v0.2.2) Alternativa de despliegue sin Actions: `npm run build:pages` copia dist/ a `docs/` (Pages → Deploy from a branch → /docs). `docs/` contiene la app compilada y debe subirse al repo.

## 10. Pendientes por confirmar con el usuario
Ninguno. Todos los pendientes fueron resueltos por el usuario y el stack de la sección 5 está **confirmado**.

## 11. Próximos pasos
1. HECHO (v0.1): andamiaje, datos clínicos, lógica pura con pruebas (137 en v0.2), modelo 3D por código (5 modelos), pintado por zonas con pincel (grado + fracción/palmas), resultados, semáforo de diuresis, recomendaciones y derivación, PWA offline.
2. Revisión clínica por el usuario: probar casos reales contra el protocolo y el Excel (si se aporta) para validar números.
3. Mejoras posibles: exportar los modelos a GLB, modelos 3D más anatómicos, impresión del reporte, historial en IndexedDB o servidor, pintado fino sobre la malla, idioma/ajustes.

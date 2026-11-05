# 📖 LexiLearn Frontend

Aplicación Web accesible e interactiva desarrollada en **React 19, TypeScript, Vite y Tailwind CSS** para la plataforma de aprendizaje asistivo **LexiLearn**, diseñada para estudiantes con dislexia, TDAH y TEA.

Consume la API REST de [LexiLearn-Backend](https://github.com/Oskrtim2/LexiLearn-Backend.git).

---

## ✨ Características Principales

* **Autenticación Accesible:**
  * Inicio de sesión con **PIN de 4-6 dígitos** y teclado numérico amigable.
  * Inicio de sesión mediante **Código QR** con escáner de cámara web integrado (`html5-qrcode`).
  * Inicio de sesión por **Secuencia Visual de Iconos** (estrella, luna, sol, flor, etc.) para niños sin requerir contraseñas.
  * Cuentas demo preconfiguradas para acceso rápido de prueba (Sam `LEX-001` y Maya `LEX-002`).

* **Lector Asistivo y Fonología:**
  * **Modo Sílabas:** División fonológica de palabras en español con diptongos, hiatos y dígrafos.
  * **Modo Micro-cláusulas:** Fragmentación de oraciones largas para reducir fatiga cognitiva en TDAH.
  * **Regla de Enfoque (*Line Focus*):** Ilumina de 1 a N líneas atenuando las demás para guiar la lectura.
  * **Métricas de Dificultad:** Estimación Flesch/Huerta (0-100) y cálculo de palabras por minuto.

* **Texto a Voz Neuronal (TTS):**
  * Síntesis de voz conectada al backend con reproducción de audio MP3 firmado y en caché.
  * Resaltado visual en tiempo real de la oración que se está escuchando.

* **Escáner OCR de Libros:**
  * Captura de fotos en vivo mediante cámara web o carga de imágenes (PNG/JPEG/WebP < 10 MB).
  * Extracción y limpieza automática de texto lista para abrir en el Lector Asistivo.

* **Gamificación Sensorial y No Punitiva:**
  * Acumulación de XP por cada oración o lectura completada.
  * Animaciones suaves de celebración (*soft-glow*) sin sobreestimulación sensorial.
  * Racha de días de enfoque acumulativa y vitrina de medallas permanentes.
  * Registro de tiempo de lectura mediante *heartbeats* en segundo plano.

* **Ajustes de Accesibilidad:**
  * Tipografías: **OpenDyslexic**, **Atkinson Hyperlegible**, Verdana, Arial, Comic Sans.
  * Modos de Contraste: Claro, Oscuro, Pastel Cálido (anti-fatiga visual) y Alto Contraste.
  * Controles deslizantes de espaciado entre letras, altura de línea y personas de voz TTS.

* **Portal del Educador:**
  * Aprovisionamiento de nuevos alumnos y generación de tarjetas con código QR listas para imprimir.

* **Conmutador de Servidor:**
  * Botón para alternar la URL del backend (`http://localhost:3000/api/v1` en local o URL en la nube).

---

## 🛠️ Tecnologías

* **React 19**
* **TypeScript** (modo estricto)
* **Vite 8**
* **Tailwind CSS v4** (`@tailwindcss/vite`)
* **Lucide React** (iconografía accesible)
* **HTML5 QR Code** (escáner QR con cámara web)
* **Canvas Confetti** (celebraciones sensoriales suaves)

---

## 🚀 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (opcional, por defecto conecta a localhost:3000)
cp .env.example .env

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: **`http://localhost:5173`**

### Compilación para Producción

```bash
npm run build
npm run preview
```

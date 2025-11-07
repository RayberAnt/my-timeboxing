# My Timeboxing 📦⏰

Una aplicación web de timeboxing para gestionar tu tiempo de manera efectiva.

## 🚀 Características

- **Top Priorities**: Define tus 3 prioridades principales del día
- **Brain Dump**: Captura todas tus tareas e ideas
- **Schedule**: Planifica tu día en bloques de 30 minutos (5am - 11pm)
- **Drag & Drop**: Arrastra tareas a tu horario
- **Multiple Tasks**: Asigna múltiples tareas al mismo bloque de tiempo

## 🛠️ Tecnologías

- React 18
- Tailwind CSS
- Lucide React (iconos)
- Create React App

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/my-timeboxing.git
cd my-timeboxing
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 🏗️ Build para Producción

```bash
npm run build
```

Esto creará una carpeta `build/` con los archivos optimizados para producción.

## 📝 Uso

1. **Escribe tus prioridades** en la sección "Top Priorities"
2. **Agrega tareas** en "Brain Dump" (presiona Enter para crear nuevas líneas)
3. **Arrastra las tareas** a los bloques de tiempo en tu horario
4. **Organiza tu día** asignando tiempos específicos a cada actividad

## 🚀 Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Arrastra la carpeta build/ a Netlify
```

### GitHub Pages
Agrega a `package.json`:
```json
"homepage": "https://tu-usuario.github.io/my-timeboxing"
```

Instala gh-pages:
```bash
npm install --save-dev gh-pages
```

Agrega scripts:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```

Despliega:
```bash
npm run deploy
```

## 📄 Licencia

MIT

## 👤 Autor

Tu Nombre - [@tu-usuario](https://github.com/tu-usuario)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir cambios mayores.
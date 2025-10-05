# Exam Study App

A modular quiz and exam simulator web application for self-study and practice.

## Project Structure

```
├── src/           # JavaScript source code (modules, app logic)
│   ├── app.js
│   ├── sidebar.js
│   ├── splash.js
│   ├── quiz.js
│   ├── admin.js
│   ├── examSim.js
│   ├── modules.js
│   └── utils.js
├── data/          # Quiz and exam data (JSON)
│   ├── Modulo1/
│   ├── Modulo2/
│   ├── Modulo3/
│   ├── Modulo4/
│   └── Modulo5/
├── index.html     # Main HTML file
├── style.css      # App styles
└── README.md      # Project documentation
```

## Setup & Usage

1. Clone the repository:
   ```
   git clone https://github.com/marcmanonlyme/exam-study-app.git
   ```
2. Open `index.html` in your browser to run the app locally.
3. All quiz/exam data is stored in the `data/` folder as JSON files.

## Features
- Modular quizzes by topic/section
- Exam simulation mode
- Admin page for data management
- Stats and progress tracking
- Responsive UI

## Development
- Source code is organized in ES modules under `src/`
- Helper functions in `src/utils.js`
- Data separated in `data/`
- Linting: Run `npx eslint src/` to check code style
- Formatting: Run `npx prettier --write .` to auto-format code

## Contributing
Pull requests and suggestions are welcome!

## License
MIT
//load audio files
const audioFiles = [
    { name: "Forest", path: "samples/forest_bird.wav" },
    { name: "Ocean", path: "samples/ocean_waves.wav" },
    { name: "Fire", path: "samples/fire.mp3" },
    { name: "Rain", path: "samples/rain.wav" },
    { name: "Wind", path: "samples/wind.wav" },
    { name: "Noise", path: "samples/white_noise.mp3" },
    { name: "River", path: "samples/river_flowing.wav" },
    { name: "Hike", path: "samples/mountain_hike.wav" },
    { name: "Melody", path: "samples/inner_peace.mp3" },
    { name: "Delta", path: "samples/binaural_delta.wav" }
];
// Define presets
const presets = {
    relax: {
        "Forest": 0.6,
        "Ocean": 0.7,
        "Rain": 0.4,
        "Melody": 0.3
    },
    focus: {
        "Noise": 0.8,
        "Wind": 0.5,
        "River": 0.6
    },
    sleep: {
        "Ocean": 0.5,
        "Noise": 0.4,
        "Rain": 0.3
    },
    reset: {}
};
// Initialize Tone.js players
const players = {};
const masterVolume = new Tone.Volume(0).toDestination();
let isPlaying = false;
let audioContextStarted = false;
// Load audio files into players
audioFiles.forEach(file => {
    try {
        players[file.name] = new Tone.Player({
            url: file.path,
            loop: true,
            volume: -Infinity,
        }).connect(masterVolume);
        } catch (err) {
            console.error(`Error loading ${file.name}:`, err);
        }
    });
// Play/Pause button logic
const playPauseBtn = document.getElementById('play-pause');
playPauseBtn.addEventListener('click', async () => {
    if (!audioContextStarted) {
        await Tone.start();
        audioContextStarted = true;
    }
    isPlaying = !isPlaying;
    playPauseBtn.classList.toggle('playing', isPlaying);
    Object.values(players).forEach(player => {
        if (isPlaying) {
            player.start();
        } else {
            player.stop();
        }
    });
    if (isPlaying) {
        startVisualizer();
    } else {
        stopVisualizer();
    }
});
// Preset buttons logic
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = presets[btn.dataset.preset] || {};
        audioFiles.forEach(file => {
            const slider = document.getElementById(file.name);
            const value = preset[file.name] || 0;
            slider.value = value;
            slider.dispatchEvent(new Event('input'));
        });
    });
});
// Create sliders dynamically
const slidersContainer = document.getElementById('sliders');
audioFiles.forEach(file => {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const label = document.createElement('label');
    label.htmlFor = file.name;
    label.textContent = file.name;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = file.name;
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = 0;
    row.appendChild(label);
    row.appendChild(slider);
    slidersContainer.appendChild(row);
    slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        players[file.name].volume.value = Tone.gainToDb(value);
    });
});
// Visualizer setup
const visualizer = document.getElementById('visualizer');
const analyser = new Tone.Analyser('waveform', 512);
masterVolume.connect(analyser);
let visRaf;
// Draw visualizer function
function drawVisualizer() {
    const values = analyser.getValue();
    visualizer.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Dynamically set SVG dimensions based on container
    const visualizerWidth = visualizer.clientWidth;
    const visualizerHeight = Math.min(visualizerWidth * 0.4, 60); // Responsive height, capped at 40px
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', visualizerHeight);
    
    // Adjust sampling based on screen width for performance
    const step = Math.max(4, Math.floor(values.length / (visualizerWidth / 2)));
    
    // Calculate stroke width based on screen size
    const strokeWidth = visualizerWidth < 400 ? 0.8 : visualizerWidth < 600 ? 1 : 1.2;
    
    // Scale waveform amplitude responsively
    const amplitude = visualizerHeight; // 40% of height for waveform
    
    // Create waveform path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = `M0 ${visualizerHeight / 2} `;
    for (let i = 0; i < values.length; i += step) {
        const x = (i / values.length) * visualizerWidth;
        const y = (visualizerHeight / 2) + (values[i] * amplitude);
        d += `L${x} ${y} `;
    }
    
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#ffffff');
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('fill', 'none');
    
    svg.appendChild(path);
    visualizer.appendChild(svg);
    
    // Optimize animation frame rate for smoother performance
    visRaf = requestAnimationFrame(() => {
        // Throttle updates on smaller devices
        if (visualizerWidth < 600) {
            setTimeout(drawVisualizer, 50); // 20fps for smaller screens
        } else {
            drawVisualizer(); // 60fps for larger screens
        }
    });
}
// Start/Stop visualizer functions
function startVisualizer() {
    if (!visRaf) drawVisualizer();
}
// Stop visualizer function
function stopVisualizer() {
    if (visRaf) cancelAnimationFrame(visRaf);
    visRaf = null;
    visualizer.innerHTML = '';
}

playPauseBtn.addEventListener('click', async () => {
    if (!audioContextStarted) {
        await Tone.start();  // <-- runs after real user click
        audioContextStarted = true;
    }
    ...
});


<script>
    const audioFiles = [
        { name: "Forest", path: "./samples/forest_bird.wav" },
        { name: "Ocean", path: "./samples/ocean_waves.wav" },
        { name: "Fire", path: "./samples/fire.mp3" },
        { name: "Rain", path: "./samples/rain.wav" },
        { name: "Wind", path: "./samples/wind.wav" },
        { name: "Noise", path: "./samples/white_noise.mp3" },
        { name: "River", path: "./samples/river_flowing.wav" },
        { name: "Hike", path: "./samples/mountain_hike.wav" },
        { name: "Melody", path: "./samples/inner_peace.mp3" },
    ];

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

    let players = {};
    let masterVolume = null;
    let analyser = null;
    let isPlaying = false;
    let audioContextStarted = false;

    // Initialize audio only after user interaction
    function initializeAudio() {
        if (!audioContextStarted) {
            masterVolume = new Tone.Volume(0).toDestination();
            analyser = new Tone.Analyser('waveform', 512).connect(masterVolume);
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
            audioContextStarted = true;
        }
    }

    const playPauseBtn = document.getElementById('play-pause');
    playPauseBtn.addEventListener('click', async () => {
        try {
            if (!audioContextStarted) {
                await Tone.start();
                console.log('AudioContext started');
                initializeAudio();
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
        } catch (err) {
            console.error('Error starting audio:', err);
        }
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!audioContextStarted) {
                console.warn('AudioContext not started. Please click play first.');
                return;
            }
            const preset = presets[btn.dataset.preset] || {};
            audioFiles.forEach(file => {
                const slider = document.getElementById(file.name);
                const value = preset[file.name] || 0;
                slider.value = value;
                slider.dispatchEvent(new Event('input'));
            });
        });
    });

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
            if (!audioContextStarted) return;
            const value = parseFloat(slider.value);
            if (players[file.name]) {
                players[file.name].volume.value = Tone.gainToDb(value);
            }
        });
    });

    const visualizer = document.getElementById('visualizer');
    let visRaf;

    function drawVisualizer() {
        if (!analyser) return;
        const values = analyser.getValue();
        visualizer.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const visualizerWidth = visualizer.clientWidth;
        const visualizerHeight = Math.min(visualizerWidth * 0.1, 40);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', visualizerHeight);
        const step = Math.max(4, Math.floor(values.length / (visualizerWidth / 2)));
        const strokeWidth = visualizerWidth < 400 ? 0.8 : visualizerWidth < 600 ? 1 : 1.2;
        const amplitude = visualizerHeight * 0.4;
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
        visRaf = requestAnimationFrame(() => {
            if (visualizerWidth < 600) {
                setTimeout(drawVisualizer, 50);
            } else {
                drawVisualizer();
            }
        });
    }

    function startVisualizer() {
        if (!visRaf) drawVisualizer();
    }

    function stopVisualizer() {
        if (visRaf) cancelAnimationFrame(visRaf);
        visRaf = null;
        visualizer.innerHTML = '';
    }
</script>

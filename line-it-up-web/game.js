/**
 * Line It Up - Game Engine & WebRTC Multiplayer
 * Vintage Comic Style by Photo. Memory
 */

// Category items dataset mapping exactly to assets/icons/
const CATEGORIES_DATA = {
    animals: [
        { name: 'Bear', icon: 'bear.png' },
        { name: 'Cat', icon: 'cat.png' },
        { name: 'Chick', icon: 'chick.png' },
        { name: 'Cow', icon: 'cow.png' },
        { name: 'Deer', icon: 'deer.png' },
        { name: 'Dog', icon: 'dog.png' },
        { name: 'Duck', icon: 'duck.png' },
        { name: 'Elephant', icon: 'elephant.png' },
        { name: 'Fox', icon: 'fox.png' },
        { name: 'Frog', icon: 'frog.png' },
        { name: 'Giraffe', icon: 'giraffe.png' },
        { name: 'Hamster', icon: 'hamster.png' },
        { name: 'Hedgehog', icon: 'hedgehog.png' },
        { name: 'Koala', icon: 'koala.png' },
        { name: 'Lion', icon: 'lion.png' },
        { name: 'Monkey', icon: 'monkey.png' },
        { name: 'Otter', icon: 'otter.png' },
        { name: 'Owl', icon: 'owl.png' },
        { name: 'Panda', icon: 'panda.png' },
        { name: 'Penguin', icon: 'penguin.png' },
        { name: 'Pig', icon: 'pig.png' },
        { name: 'Rabbit', icon: 'rabbit.png' },
        { name: 'Raccoon', icon: 'raccoon.png' },
        { name: 'Red Panda', icon: 'red_panda.png' },
        { name: 'Sheep', icon: 'sheep.png' },
        { name: 'Sloth', icon: 'sloth.png' },
        { name: 'Squirrel', icon: 'squirrel.png' },
        { name: 'Tiger', icon: 'tiger.png' },
        { name: 'Wolf', icon: 'wolf.png' },
        { name: 'Zebra', icon: 'zebra.png' }
    ],
    foods: [
        { name: 'Apple', icon: 'apple.png' },
        { name: 'Avocado', icon: 'avocado.png' },
        { name: 'Bananas', icon: 'bananas.png' },
        { name: 'Bread Loaf', icon: 'bread_loaf.png' },
        { name: 'Broccoli', icon: 'broccoli.png' },
        { name: 'Burger', icon: 'burger.png' },
        { name: 'Carrot', icon: 'carrot.png' },
        { name: 'Cheese', icon: 'cheese.png' },
        { name: 'Chocolate Bar', icon: 'chocolate_bar.png' },
        { name: 'Cookie', icon: 'cookie.png' },
        { name: 'Croissant', icon: 'croissant.png' },
        { name: 'Cupcake', icon: 'cupcake.png' },
        { name: 'Donut', icon: 'donut.png' },
        { name: 'French Fries', icon: 'french_fries.png' },
        { name: 'Fried Egg', icon: 'fried_egg.png' },
        { name: 'Grapes', icon: 'grapes.png' },
        { name: 'Hot Dog', icon: 'hot_dog.png' },
        { name: 'Ice Cream', icon: 'ice_cream_cone.png' },
        { name: 'Milk Carton', icon: 'milk_carton.png' },
        { name: 'Pancakes', icon: 'pancakes.png' },
        { name: 'Pineapple', icon: 'pineapple.png' },
        { name: 'Pizza Slice', icon: 'pizza_slice.png' },
        { name: 'Popcorn', icon: 'popcorn.png' },
        { name: 'Pretzel', icon: 'pretzel.png' },
        { name: 'Ramen', icon: 'ramen.png' },
        { name: 'Sandwich', icon: 'sandwich.png' },
        { name: 'Strawberry', icon: 'strawberry.png' },
        { name: 'Sushi', icon: 'sushi.png' },
        { name: 'Taco', icon: 'taco.png' },
        { name: 'Watermelon', icon: 'watermelon_slice.png' }
    ],
    objects: [
        { name: 'Alarm Clock', icon: 'alarm_clock.png' },
        { name: 'Backpack', icon: 'backpack.png' },
        { name: 'Baseball Cap', icon: 'baseball_cap.png' },
        { name: 'Book', icon: 'book.png' },
        { name: 'Camera', icon: 'camera.png' },
        { name: 'Coffee Mug', icon: 'coffee_mug.png' },
        { name: 'Donut', icon: 'donut.png' },
        { name: 'Flashlight', icon: 'flashlight.png' },
        { name: 'Controller', icon: 'game_controller.png' },
        { name: 'Gift Box', icon: 'gift_box.png' },
        { name: 'Globe', icon: 'globe.png' },
        { name: 'Guitar', icon: 'guitar.png' },
        { name: 'Headphones', icon: 'headphones.png' },
        { name: 'Key', icon: 'key.png' },
        { name: 'Laptop', icon: 'laptop.png' },
        { name: 'Paint Palette', icon: 'paint_palette.png' },
        { name: 'Pencil', icon: 'pencil.png' },
        { name: 'Pizza Slice', icon: 'pizza_slice.png' },
        { name: 'Potted Plant', icon: 'potted_plant.png' },
        { name: 'Roller Skate', icon: 'roller_skate.png' },
        { name: 'Scissors', icon: 'scissors.png' },
        { name: 'Skateboard', icon: 'skateboard.png' },
        { name: 'Sneaker', icon: 'sneaker.png' },
        { name: 'Soccer Ball', icon: 'soccer_ball.png' },
        { name: 'Sunglasses', icon: 'sunglasses.png' },
        { name: 'Table Lamp', icon: 'table_lamp.png' },
        { name: 'Toaster', icon: 'toaster.png' },
        { name: 'Toy Robot', icon: 'toy_robot.png' },
        { name: 'Umbrella', icon: 'umbrella.png' },
        { name: 'Watering Can', icon: 'watering_can.png' }
    ],
    people: [
        { name: 'Blond Shirt', icon: 'blond_person_black_shirt.png' },
        { name: 'Blond Glasses', icon: 'blond_person_glasses.png' },
        { name: 'Curly Hair', icon: 'curly_blond_person.png' },
        { name: 'Beanie Person', icon: 'person_beanie.png' },
        { name: 'Beret Person', icon: 'person_beret.png' },
        { name: 'Cap Person', icon: 'person_blue_cap.png' },
        { name: 'Blue Shirt', icon: 'person_blue_shirt.png' },
        { name: 'Bob Haircut', icon: 'person_bob_haircut.png' },
        { name: 'Cream Hoodie', icon: 'person_cream_hoodie.png' },
        { name: 'Cream Sweater', icon: 'person_cream_sweater.png' },
        { name: 'Denim Jacket', icon: 'person_denim_jacket.png' },
        { name: 'Glasses Denim', icon: 'person_glasses_denim.png' },
        { name: 'Green Sweater', icon: 'person_green_hooded_sweater.png' },
        { name: 'Green Hoodie', icon: 'person_green_hoodie.png' },
        { name: 'Green Jacket', icon: 'person_green_jacket.png' },
        { name: 'Hair Bun', icon: 'person_hair_bun.png' },
        { name: 'Headband', icon: 'person_headband.png' },
        { name: 'Long Black Hair', icon: 'person_long_black_hair.png' },
        { name: 'Orange Hoodie', icon: 'person_orange_hoodie.png' },
        { name: 'Orange Sweater', icon: 'person_orange_sweater.png' },
        { name: 'Orange Top', icon: 'person_orange_top.png' },
        { name: 'Pink Hoodie', icon: 'person_pink_hoodie.png' },
        { name: 'Ponytail Hair', icon: 'person_ponytail.png' },
        { name: 'Red Hair', icon: 'person_red_hair.png' },
        { name: 'Round Glasses', icon: 'person_round_glasses.png' },
        { name: 'Square Glasses', icon: 'person_square_glasses.png' },
        { name: 'Tan Jacket', icon: 'person_tan_jacket.png' },
        { name: 'White Hoodie', icon: 'person_white_hoodie.png' },
        { name: 'Yellow Hoodie', icon: 'person_yellow_hoodie.png' },
        { name: 'Smiling Yellow', icon: 'person_yellow_hoodie_smiling.png' }
    ],
    places: [
        { name: 'Airport', icon: 'airport.png' },
        { name: 'Aquarium', icon: 'aquarium.png' },
        { name: 'Art Studio', icon: 'art_studio.png' },
        { name: 'Bakery', icon: 'bakery.png' },
        { name: 'Barn', icon: 'barn.png' },
        { name: 'Beach House', icon: 'beach_house.png' },
        { name: 'Bookstore', icon: 'bookstore.png' },
        { name: 'Cafe', icon: 'cafe.png' },
        { name: 'Campsite', icon: 'campsite.png' },
        { name: 'Castle', icon: 'castle.png' },
        { name: 'Church', icon: 'church.png' },
        { name: 'Fire Station', icon: 'fire_station.png' },
        { name: 'Flower Shop', icon: 'flower_shop.png' },
        { name: 'Gas Station', icon: 'gas_station.png' },
        { name: 'Gazebo', icon: 'gazebo.png' },
        { name: 'Grocery Store', icon: 'grocery_store.png' },
        { name: 'Hospital', icon: 'hospital.png' },
        { name: 'Hotel', icon: 'hotel.png' },
        { name: 'House', icon: 'house.png' },
        { name: 'Ice Cream Shop', icon: 'ice_cream_shop.png' },
        { name: 'Library', icon: 'library.png' },
        { name: 'Lighthouse', icon: 'lighthouse.png' },
        { name: 'Movie Theater', icon: 'movie_theater.png' },
        { name: 'Museum', icon: 'museum.png' },
        { name: 'Music Store', icon: 'music_store.png' },
        { name: 'Playground', icon: 'playground.png' },
        { name: 'Police Station', icon: 'police_station.png' },
        { name: 'Restaurant', icon: 'restaurant.png' },
        { name: 'School', icon: 'school.png' },
        { name: 'Train Station', icon: 'train_station.png' }
    ],
    space: [
        { name: 'Asteroid Belt', icon: 'asteroid_belt.png' },
        { name: 'Astronaut', icon: 'astronaut.png' },
        { name: 'Aurora', icon: 'aurora.png' },
        { name: 'Black Hole', icon: 'black_hole.png' },
        { name: 'Comet', icon: 'comet.png' },
        { name: 'Constellation', icon: 'constellation.png' },
        { name: 'Earth', icon: 'earth.png' },
        { name: 'Exoplanet', icon: 'exoplanet.png' },
        { name: 'Galaxy', icon: 'galaxy.png' },
        { name: 'Jupiter', icon: 'jupiter.png' },
        { name: 'Lunar Lander', icon: 'lunar_lander.png' },
        { name: 'Mars', icon: 'mars.png' },
        { name: 'Mercury', icon: 'mercury.png' },
        { name: 'Meteor', icon: 'meteor.png' },
        { name: 'Moon', icon: 'moon.png' },
        { name: 'Nebula', icon: 'nebula.png' },
        { name: 'Neptune', icon: 'neptune.png' },
        { name: 'Pluto', icon: 'pluto.png' },
        { name: 'Telescope', icon: 'radio_telescope.png' },
        { name: 'Rocket', icon: 'rocket.png' },
        { name: 'Satellite', icon: 'satellite.png' },
        { name: 'Saturn', icon: 'saturn.png' },
        { name: 'Shooting Star', icon: 'shooting_star.png' },
        { name: 'Space Telescope', icon: 'space_telescope.png' },
        { name: 'Stars', icon: 'stars.png' },
        { name: 'Sun', icon: 'sun.png' },
        { name: 'Supernova', icon: 'supernova.png' },
        { name: 'UFO', icon: 'ufo.png' },
        { name: 'Uranus', icon: 'uranus.png' },
        { name: 'Venus', icon: 'venus.png' }
    ],
    water_animals: [
        { name: 'Anglerfish', icon: 'anglerfish.png' },
        { name: 'Beluga Whale', icon: 'beluga_whale.png' },
        { name: 'Blue Dolphin', icon: 'blue_dolphin.png' },
        { name: 'Blue Tang', icon: 'blue_tang.png' },
        { name: 'Clownfish', icon: 'clownfish.png' },
        { name: 'Crab', icon: 'crab.png' },
        { name: 'Dolphin', icon: 'dolphin.png' },
        { name: 'Eel', icon: 'eel.png' },
        { name: 'Goldfish', icon: 'goldfish.png' },
        { name: 'Jellyfish', icon: 'jellyfish.png' },
        { name: 'Koi Fish', icon: 'koi_fish.png' },
        { name: 'Leafy Seadragon', icon: 'leafy_seadragon.png' },
        { name: 'Lobster', icon: 'lobster.png' },
        { name: 'Manta Ray', icon: 'manta_ray.png' },
        { name: 'Narwhal', icon: 'narwhal.png' },
        { name: 'Octopus', icon: 'octopus.png' },
        { name: 'Orca', icon: 'orca.png' },
        { name: 'Pufferfish', icon: 'pufferfish.png' },
        { name: 'Sea Lion', icon: 'sea_lion.png' },
        { name: 'Sea Otter', icon: 'sea_otter.png' },
        { name: 'Sea Turtle', icon: 'sea_turtle.png' },
        { name: 'Seahorse', icon: 'seahorse.png' },
        { name: 'Seal', icon: 'seal.png' },
        { name: 'Shark', icon: 'shark.png' },
        { name: 'Squid', icon: 'squid.png' },
        { name: 'Starfish', icon: 'starfish.png' },
        { name: 'Stingray', icon: 'stingray.png' },
        { name: 'Walrus', icon: 'walrus.png' },
        { name: 'Penguin', icon: 'water_penguin.png' },
        { name: 'Whale', icon: 'whale.png' }
    ]
};

// Gradient color codes for Bottle Mode test tubes
const BOTTLE_COLORS = [
    { id: 1, name: 'Cherry Red', gradient: 'linear-gradient(to top, #FF3E4D, #FFA4A4)' },
    { id: 2, name: 'Royal Indigo', gradient: 'linear-gradient(to top, #2D46B9, #8C9EFF)' },
    { id: 3, name: 'Golden Sun', gradient: 'linear-gradient(to top, #FFC93C, #FFE49F)' },
    { id: 4, name: 'Vintage Emerald', gradient: 'linear-gradient(to top, #12947F, #8BEAD9)' },
    { id: 5, name: 'Burnt Orange', gradient: 'linear-gradient(to top, #E04D01, #FF9F29)' }
];

class LineItUpGame {
    constructor() {
        this.gameState = {
            isPlaying: false,
            mode: 'solo', // 'solo' | 'bottle' | 'multiplayer'
            category: 'animals',
            guessesRemaining: 8,
            guessesUsed: 0,
            boardState: [], // Array of 5 items
            secretSequence: [], // Target array
            selectedSlotIndex: null,
            guessHistory: [],
            opponentGuessHistory: [],
            rewardedAdUsed: false,
            matchStartTime: 0,
            lobbyId: null,
            timer: 30,
            timerInterval: null
        };

        // Profile configuration
        this.profile = {
            username: Platform.getUsername(),
            avatar: 'person_beanie'
        };

        // PeerJS P2P Networking variables
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.networkRole = null; // 'host' | 'client'
        this.peerConnected = false;
        this.opponentProfile = { username: 'Opponent', avatar: 'person_ponytail' };
        this.opponentSubmitted = false;
        this.opponentLastGuess = null;

        // Audio Elements
        this.musicAudio = new Audio('assets/audio/music-Memories in Black and White.mp3');
        this.musicAudio.loop = true;
        this.musicAudio.volume = 0.4;
        this.isMuted = false;

        this.sfx = {
            click: new Audio('assets/audio/mixkit-plastic-bubble-click-1124.wav'),
            pop: new Audio('assets/audio/mixkit-cartoon-bubbles-popping-732 (1).wav'),
            win: new Audio('assets/audio/mixkit-unlock-game-notification-253.wav'),
            loss: new Audio('assets/audio/mixkit-game-show-buzz-in-3090.wav'),
            bubbleClick: new Audio('assets/audio/mixkit-liquid-bubble-3000.wav'),
            tick: new Audio('assets/audio/mixkit-tick-tock-clock-close-up-1059.wav')
        };

        // Setup default volumes
        Object.values(this.sfx).forEach(audio => {
            audio.volume = 0.55;
        });
        this.sfx.tick.volume = 0.35;
    }

    async init() {
        console.log("[GameEngine] Initializing Line It Up Engine...");
        
        // Initialize Supabase Client
        const SUPABASE_URL = 'https://kzeeojfmvrvleahzdmnl.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZWVvamZtdnJ2bGVhaHpkbW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzODczNTIsImV4cCI6MjA2NDk2MzM1Mn0.CapusMv9ApAWBDNA0ZQALdQ0RPWSeLeOcw61k06OXbs';
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Initialize Platform Adapter
        await Platform.init();
        
        // Update user config from storage
        this.profile.username = Platform.getUsername();
        const savedAvatar = localStorage.getItem('lineitup_avatar');
        if (savedAvatar) {
            this.profile.avatar = savedAvatar;
        }

        this.bindDOMEvents();
        this.updateProfileUI();
        this.renderStatsLobby();
        this.renderLeaderboardLobby();
        this.setupAudioListeners();
        this.checkForInviteLink();
    }

    // Connect audio mute callbacks to Platform wrapper
    setupAudioListeners() {
        Platform.onMute(() => {
            console.log("[GameEngine] Muting audio on focus loss / ad trigger.");
            this.musicAudio.pause();
            Object.values(this.sfx).forEach(s => s.muted = true);
        });

        Platform.onUnmute(() => {
            console.log("[GameEngine] Unmuting audio on focus regain / ad end.");
            if (!this.isMuted && this.gameState.isPlaying) {
                this.musicAudio.play().catch(e => console.log("Music play blocked by gesture"));
            }
            Object.values(this.sfx).forEach(s => s.muted = false);
        });

        // Loop background music on first user click anywhere
        document.body.addEventListener('click', () => {
            if (!this.isMuted && this.musicAudio.paused) {
                this.musicAudio.play().catch(e => console.log("Audio autoplay prevented"));
            }
        }, { once: true });
    }

    playSFX(name) {
        if (this.isMuted) return;
        try {
            const sound = this.sfx[name];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {});
            }
        } catch (e) {
            console.error("SFX trigger failed:", e);
        }
    }

    updateProfileUI() {
        document.getElementById('header-username').innerText = this.profile.username;
        document.getElementById('header-avatar').src = `assets/icons/people/${this.profile.avatar}.png`;
        document.getElementById('profile-username-input').value = this.profile.username;

        // Render active avatar outline in Lobby picker
        document.querySelectorAll('.avatar-option').forEach(img => {
            if (img.getAttribute('data-avatar') === this.profile.avatar) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
    }

        // Wire up HTML page event clicks
    bindDOMEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playSFX('click');
                const targetTab = btn.getAttribute('data-tab');
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const content = document.getElementById(targetTab);
                if (content) content.classList.add('active');
                
                if (targetTab === 'daily-panel-liu') {
                    this.loadDailyChallengesTab();
                }
            });
        });

        // Daily challenge premium unlock
        document.getElementById('buy-daily-premium-btn').addEventListener('click', () => {
            this.playSFX('click');
            if (localStorage.getItem('lineitup_daily_premium') === 'true') {
                alert("You already unlocked Premium Challenge Access! Enjoy replay access.");
                return;
            }
            if (confirm("Simulate purchasing Premium Challenge Access for $4.99? This will permanently unlock all past challenges and remove replay cooldowns.")) {
                localStorage.setItem('lineitup_daily_premium', 'true');
                alert("Mock purchase successful! Premium Challenge Access has been unlocked.");
                this.updateDailyPremiumBanner();
                if (this.selectedDailyDate && this.dailyChallengesMap[this.selectedDailyDate]) {
                    this.showDailyChallengeDetails(this.dailyChallengesMap[this.selectedDailyDate]);
                }
            }
        });

        // Solo match trigger
        document.getElementById('start-solo-btn').addEventListener('click', () => {
            this.playSFX('click');
            const categorySelect = document.getElementById('solo-category-select');
            this.startNewGame('solo', categorySelect.value);
        });

        // Bottle mode trigger
        document.getElementById('start-bottle-btn').addEventListener('click', () => {
            this.playSFX('click');
            this.startNewGame('bottle');
        });

        // Submit guess button
        document.getElementById('submit-guess-btn').addEventListener('click', () => {
            this.submitActiveGuess();
        });

        // Forfeit Button
        document.getElementById('forfeit-btn').addEventListener('click', () => {
            this.playSFX('click');
            if (confirm("Are you sure you want to forfeit this match? Your active progress will be lost.")) {
                this.handleForfeit();
            }
        });

        // IAP Remove Ads
        document.getElementById('iap-remove-ads-btn').addEventListener('click', () => {
            this.playSFX('click');
            if (Platform.isAdsRemoved()) {
                alert("You are already a Premium user! Ads are removed.");
                return;
            }
            Platform.purchaseRemoveAds(() => {
                alert("Thank you! Ads have been permanently removed from your device.");
                document.getElementById('iap-remove-ads-btn').style.display = 'none';
            });
        });

        // Header audio toggle
        document.getElementById('audio-toggle-btn').addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            const icon = document.querySelector('#audio-toggle-btn i');
            if (this.isMuted) {
                icon.className = 'fa-solid fa-volume-xmark';
                this.musicAudio.pause();
            } else {
                icon.className = 'fa-solid fa-volume-high';
                if (this.gameState.isPlaying) {
                    this.musicAudio.play().catch(e => {});
                }
            }
        });

        // Profile customization listeners
        document.querySelectorAll('.avatar-option').forEach(img => {
            img.addEventListener('click', () => {
                this.playSFX('click');
                this.profile.avatar = img.getAttribute('data-avatar');
                localStorage.setItem('lineitup_avatar', this.profile.avatar);
                this.updateProfileUI();
            });
        });

        document.getElementById('save-profile-btn').addEventListener('click', () => {
            this.playSFX('click');
            const nameInput = document.getElementById('profile-username-input').value;
            if (nameInput && nameInput.trim() !== '') {
                this.profile.username = nameInput.trim();
                Platform.setUsername(this.profile.username);
                this.updateProfileUI();
                this.renderStatsLobby();
                alert("Profile configuration saved successfully!");
            }
        });

        // Tutorial logic
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.playSFX('click');
            this.openTutorialModal();
        });
        document.getElementById('close-tutorial-btn').addEventListener('click', () => {
            this.playSFX('click');
            document.getElementById('tutorial-modal').classList.remove('active');
        });

        let currentSlide = 0;
        const slides = document.querySelectorAll('.carousel-slide');
        const prevBtn = document.getElementById('tutorial-prev-btn');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const indicator = document.getElementById('tutorial-indicator');

        const updateCarousel = () => {
            slides.forEach((slide, index) => {
                if (index === currentSlide) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
            indicator.innerText = `${currentSlide + 1} / ${slides.length}`;
            prevBtn.disabled = currentSlide === 0;
            nextBtn.innerText = currentSlide === slides.length - 1 ? 'Finish' : 'Next';
        };

        prevBtn.addEventListener('click', () => {
            this.playSFX('click');
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
            }
        });

        nextBtn.addEventListener('click', () => {
            this.playSFX('click');
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                updateCarousel();
            } else {
                document.getElementById('tutorial-modal').classList.remove('active');
            }
        });

        // P2P Matchmaking actions
        document.getElementById('host-match-btn').addEventListener('click', () => {
            this.playSFX('click');
            this.initializeHostLobby();
        });

        document.getElementById('close-host-modal-btn').addEventListener('click', () => {
            this.playSFX('click');
            this.closeP2PHostLobby();
        });

        document.getElementById('join-match-btn').addEventListener('click', () => {
            this.playSFX('click');
            const targetPeerId = document.getElementById('join-peer-id-input').value.trim();
            if (targetPeerId) {
                this.connectToHostPeer(targetPeerId);
            } else {
                alert("Please enter a valid Host Peer ID!");
            }
        });

        document.getElementById('copy-invite-link-btn').addEventListener('click', () => {
            this.playSFX('click');
            const linkInput = document.getElementById('invite-link-input');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(linkInput.value).then(() => {
                alert("Direct invite link copied to clipboard!");
            });
        });

        // Modals Action Handles
        document.getElementById('result-lobby-btn').addEventListener('click', () => {
            this.playSFX('click');
            document.getElementById('match-end-modal').classList.remove('active');
            this.returnToLobbyScreen();
        });

        document.getElementById('result-rematch-btn').addEventListener('click', () => {
            this.playSFX('click');
            document.getElementById('match-end-modal').classList.remove('active');
            
            if (this.gameState.mode === 'multiplayer') {
                this.offerMultiplayerRematch();
            } else {
                this.startNewGame(this.gameState.mode, this.gameState.category);
            }
        });

        // Rewarded Second chance buttons
        document.getElementById('second-chance-watch-btn').addEventListener('click', () => {
            this.playSFX('click');
            this.watchRewardedAdGuesses();
        });

        document.getElementById('second-chance-giveup-btn').addEventListener('click', () => {
            this.playSFX('click');
            document.getElementById('second-chance-modal').classList.remove('active');
            this.finalizeMatch(false);
        });

        document.getElementById('close-view-stats-btn').addEventListener('click', () => {
            this.playSFX('click');
            document.getElementById('view-stats-modal').classList.remove('active');
        });
    }

    openTutorialModal() {
        const modal = document.getElementById('tutorial-modal');
        modal.classList.add('active');
    }

    // ==========================================================================
    // GAME CORE LOGIC
    // ==========================================================================

    startNewGame(mode, category = 'animals') {
        console.log(`[GameEngine] Starting Match in mode: ${mode}, category: ${category}`);
        
        // Setup initial structure
        this.gameState.isPlaying = true;
        this.gameState.mode = mode;
        this.gameState.category = category;
        this.gameState.guessesRemaining = 8;
        this.gameState.guessesUsed = 0;
        this.gameState.guessHistory = [];
        this.gameState.opponentGuessHistory = [];
        this.gameState.rewardedAdUsed = false;
        this.gameState.selectedSlotIndex = null;
        this.gameState.matchStartTime = Date.now();
        this.opponentSubmitted = false;

        // Clear display containers
        document.getElementById('player-history-list').innerHTML = '';
        document.getElementById('opponent-history-list').innerHTML = '';
        document.getElementById('guesses-remaining').innerText = '8';
        document.getElementById('waiting-overlay-bar').style.display = 'none';
        document.getElementById('submit-guess-btn').disabled = false;

        if (mode === 'solo' || mode === 'multiplayer') {
            document.getElementById('gameplay-mode-label').innerText = mode === 'solo' ? 'Solo Mode' : 'P2P Online';
            document.getElementById('gameplay-topic-label').innerText = `Category: ${category.replace('_', ' ').toUpperCase()}`;
            document.getElementById('opponent-history-wrapper').style.display = mode === 'multiplayer' ? 'flex' : 'none';
            document.getElementById('multiplayer-vs-pill').style.display = mode === 'multiplayer' ? 'flex' : 'none';
            
            if (mode === 'solo') {
                this.generateSoloPuzzle(category);
            }
        } else if (mode === 'bottle') {
            document.getElementById('gameplay-mode-label').innerText = 'Bottle Mode';
            document.getElementById('gameplay-topic-label').innerText = 'Organize Fluid Gradients';
            document.getElementById('opponent-history-wrapper').style.display = 'none';
            document.getElementById('multiplayer-vs-pill').style.display = 'none';
            this.generateBottlePuzzle();
        }

        // Transitions screen
        document.getElementById('lobby-panel').classList.remove('active');
        document.getElementById('gameplay-panel').classList.add('active');

        // Play ambient music
        if (!this.isMuted) {
            this.musicAudio.currentTime = 0;
            this.musicAudio.play().catch(e => {});
        }

        // Setup timer countdown for multiplayer matches
        this.setupGameplayTimer();
    }

    setupGameplayTimer(resume = false) {
        clearInterval(this.timerInterval);
        
        if (this.gameState.mode === 'multiplayer') {
            document.getElementById('gameplay-timer-container').style.display = 'block';
            if (!resume) {
                this.gameState.timer = 30;
            }
            document.getElementById('gameplay-timer').innerText = this.gameState.timer;
            
            this.timerInterval = setInterval(() => {
                this.gameState.timer--;
                document.getElementById('gameplay-timer').innerText = this.gameState.timer;
                
                // Tick audio feedback in the last 5 seconds
                if (this.gameState.timer <= 5 && this.gameState.timer > 0) {
                    this.playSFX('tick');
                }
                
                if (this.gameState.timer <= 0) {
                    clearInterval(this.timerInterval);
                    console.log("[GameEngine] Timer expired! Auto-submitting current layout.");
                    this.submitActiveGuess();
                }
            }, 1000);
        } else {
            // Count up timer in solo just for aesthetics
            document.getElementById('gameplay-timer-container').style.display = 'block';
            if (!resume) {
                this.gameState.timer = 0;
            }
            document.getElementById('gameplay-timer').innerText = this.gameState.timer;
            this.timerInterval = setInterval(() => {
                this.gameState.timer++;
                document.getElementById('gameplay-timer').innerText = this.gameState.timer;
            }, 1000);
        }
    }

    // Draw random category items, shuffle starting layout
    generateSoloPuzzle(category) {
        const dataset = CATEGORIES_DATA[category];
        if (!dataset || dataset.length < 5) return;

        // Pick 5 unique random items
        const pool = [...dataset];
        const selected = [];
        for (let i = 0; i < 5; i++) {
            const randIdx = Math.floor(Math.random() * pool.length);
            selected.push(pool.splice(randIdx, 1)[0]);
        }

        this.gameState.secretSequence = [...selected];
        
        // Shuffle for initial starting position
        let shuffled = [...selected];
        let attempts = 0;
        while (attempts < 10) {
            shuffled.sort(() => Math.random() - 0.5);
            // Count correct indices
            let correctCount = 0;
            for (let i = 0; i < 5; i++) {
                if (shuffled[i].name === this.gameState.secretSequence[i].name) correctCount++;
            }
            // Ensure not 100% correct
            if (correctCount < 5) break;
            attempts++;
        }

        this.gameState.boardState = shuffled;
        this.renderBoardSlots();
    }

    // Generate 5 distinct color test tubes
    generateBottlePuzzle() {
        const colors = [...BOTTLE_COLORS];
        
        // Target Secret Sequence
        this.gameState.secretSequence = [...colors];

        // Shuffle starting state
        let shuffled = [...colors];
        let attempts = 0;
        while (attempts < 10) {
            shuffled.sort(() => Math.random() - 0.5);
            let correctCount = 0;
            for (let i = 0; i < 5; i++) {
                if (shuffled[i].id === this.gameState.secretSequence[i].id) correctCount++;
            }
            if (correctCount < 5) break;
            attempts++;
        }

        this.gameState.boardState = shuffled;
        this.renderBoardSlots();
    }

    // Render slots onto the gameplay DOM frame
    renderBoardSlots() {
        const slotsContainer = document.getElementById('slots-container');
        slotsContainer.innerHTML = '';

        this.gameState.boardState.forEach((item, index) => {
            const isSelected = this.gameState.selectedSlotIndex === index;
            
            if (this.gameState.mode === 'solo' || this.gameState.mode === 'multiplayer' || this.gameState.mode === 'daily') {
                // Render Standard Card
                const card = document.createElement('div');
                card.className = `card-slot ${isSelected ? 'selected' : ''}`;
                const imgSrc = this.gameState.mode === 'daily' ? item.imageUrl : `assets/icons/${this.gameState.category}/${item.icon}`;
                card.innerHTML = `
                    <div class="card-tag">#${index + 1}</div>
                    <img src="${imgSrc}" alt="${item.name}" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${item.name}'">
                    <span>${item.name}</span>
                `;
                card.addEventListener('click', () => this.handleSlotClick(index));
                slotsContainer.appendChild(card);
            } else if (this.gameState.mode === 'bottle') {
                // Render Realistic Potion Bottle Sort Style
                const container = document.createElement('div');
                container.className = `bottle-container ${isSelected ? 'selected' : ''}`;
                
                const bottle = document.createElement('div');
                bottle.className = 'glass-bottle';
                
                const lip = document.createElement('div');
                lip.className = 'bottle-lip';
                
                const neck = document.createElement('div');
                neck.className = 'bottle-neck';
                
                const body = document.createElement('div');
                body.className = 'bottle-body';
                
                const shine = document.createElement('div');
                shine.className = 'glass-shine';
                
                const liquid = document.createElement('div');
                liquid.className = 'liquid';
                liquid.style.background = item.gradient;
                
                // Spawn 10 dynamic bubbles inside the bubbles container
                const bubbles = document.createElement('div');
                bubbles.className = 'bubble-fx';
                for (let b = 0; b < 10; b++) {
                    const bubble = document.createElement('span');
                    bubble.className = 'micro-bubble';
                    // Spread bubbles horizontally and stagger delays
                    bubble.style.left = `${15 + Math.random() * 70}%`;
                    bubble.style.animationDelay = `${Math.random() * 3}s`;
                    bubble.style.animationDuration = `${2.5 + Math.random() * 2}s`;
                    bubble.style.transform = `scale(${0.5 + Math.random() * 0.7})`;
                    bubbles.appendChild(bubble);
                }
                
                body.appendChild(shine);
                body.appendChild(liquid);
                body.appendChild(bubbles);
                
                bottle.appendChild(lip);
                bottle.appendChild(neck);
                bottle.appendChild(body);
                
                container.appendChild(bottle);
                
                container.addEventListener('click', () => this.handleSlotClick(index));
                slotsContainer.appendChild(container);
            }
        });
    }

    // Swap items logic
    handleSlotClick(index) {
        if (this.isAnimatingSwap) return;

        if (this.gameState.selectedSlotIndex === null) {
            // Select slot
            this.gameState.selectedSlotIndex = index;
            this.renderBoardSlots();
            if (this.gameState.mode === 'bottle') {
                this.playSFX('bubbleClick');
            } else {
                this.playSFX('click');
            }
        } else if (this.gameState.selectedSlotIndex === index) {
            // Deselect
            this.gameState.selectedSlotIndex = null;
            this.renderBoardSlots();
            if (this.gameState.mode === 'bottle') {
                this.playSFX('bubbleClick');
            } else {
                this.playSFX('click');
            }
        } else {
            // Swap items with smooth sliding animation!
            const oldIdx = this.gameState.selectedSlotIndex;
            this.isAnimatingSwap = true;

            const slotsContainer = document.getElementById('slots-container');
            if (slotsContainer && slotsContainer.children[oldIdx] && slotsContainer.children[index]) {
                const elementA = slotsContainer.children[oldIdx];
                const elementB = slotsContainer.children[index];

                // Calculate screen coordinates
                const rectA = elementA.getBoundingClientRect();
                const rectB = elementB.getBoundingClientRect();

                const deltaX = rectB.left - rectA.left;
                const deltaY = rectB.top - rectA.top;

                // Style elements for visual overlap transition
                elementA.style.zIndex = '100';
                elementB.style.zIndex = '100';
                elementA.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
                elementB.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';

                // Translate them towards each other
                elementA.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                elementB.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;

                // Complete swap physically after the slide animation wraps up
                setTimeout(() => {
                    const temp = this.gameState.boardState[oldIdx];
                    this.gameState.boardState[oldIdx] = this.gameState.boardState[index];
                    this.gameState.boardState[index] = temp;
                    
                    this.gameState.selectedSlotIndex = null;
                    this.isAnimatingSwap = false;
                    this.renderBoardSlots();
                    this.playSFX('pop');
                }, 400);
            } else {
                // Fallback instant swap
                const temp = this.gameState.boardState[oldIdx];
                this.gameState.boardState[oldIdx] = this.gameState.boardState[index];
                this.gameState.boardState[index] = temp;
                
                this.gameState.selectedSlotIndex = null;
                this.isAnimatingSwap = false;
                this.renderBoardSlots();
                this.playSFX('pop');
            }
        }
    }

    // Submit user board state guess
    submitActiveGuess() {
        if (!this.gameState.isPlaying) return;
        if (this.isAnimatingSwap) return;

        let correctCount = 0;
        this.gameState.boardState.forEach((item, index) => {
            if (this.gameState.mode === 'solo' || this.gameState.mode === 'multiplayer' || this.gameState.mode === 'daily') {
                if (item.name === this.gameState.secretSequence[index].name) {
                    correctCount++;
                }
            } else if (this.gameState.mode === 'bottle') {
                if (item.id === this.gameState.secretSequence[index].id) {
                    correctCount++;
                }
            }
        });

        this.gameState.guessesUsed++;
        this.gameState.guessesRemaining--;

        const activeGuessInfo = {
            layout: [...this.gameState.boardState],
            correct: correctCount,
            total: 5
        };
        this.gameState.guessHistory.push(activeGuessInfo);

        // Update visual Guess Records scroll
        this.appendHistoryItem('player-history-list', this.gameState.guessHistory.length, correctCount);

        if (this.gameState.mode === 'multiplayer') {
            // Multiplayer Sync logic
            this.handleMultiplayerGuessSubmit(activeGuessInfo);
            return;
        }

        // Standard Solo evaluations
        document.getElementById('guesses-remaining').innerText = this.gameState.guessesRemaining;

        if (correctCount === 5) {
            // Perfect match - Victory!
            this.finalizeMatch(true);
        } else if (this.gameState.guessesRemaining <= 0) {
            if (!this.gameState.rewardedAdUsed) {
                // Offer extra guesses ad
                clearInterval(this.timerInterval);
                document.getElementById('second-chance-modal').classList.add('active');
            } else {
                // Out of guesses, Lose
                this.finalizeMatch(false);
            }
        } else {
            // Puzzle continues
            this.playSFX('click');
        }
    }

    // Visual log appends inside the vintage scrolling container
    appendHistoryItem(containerId, roundNumber, correctCount) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const emptyPlaceholder = container.querySelector('.empty-history');
        if (emptyPlaceholder) {
            container.removeChild(emptyPlaceholder);
        }

        const isPerfect = correctCount === 5;
        const item = document.createElement('div');
        item.className = `history-item ${isPerfect ? 'all-correct' : ''}`;
        
        item.innerHTML = `
            <span>Round ${roundNumber} Layout</span>
            <span class="badge">${correctCount} / 5 Correct</span>
        `;
        
        container.appendChild(item);
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    // Watch rewarded ad to grant +2 guesses expansion
    watchRewardedAdGuesses() {
        document.getElementById('second-chance-modal').classList.remove('active');
        
        Platform.showRewarded(
            () => {
                // Success ad callback
                console.log("[GameEngine] Ad watched successfully! Adding +2 guesses.");
                this.gameState.guessesRemaining = 2;
                this.gameState.rewardedAdUsed = true;
                
                document.getElementById('guesses-remaining').innerText = this.gameState.guessesRemaining;
                alert("Granted! You received 2 extra guesses to solve the puzzle.");
                
                // Restart timer countdown
                this.setupGameplayTimer(true);
            },
            () => {
                // Ad closed
                console.log("[GameEngine] Ad closed/finished.");
            }
        );
    }

    // Resolve match win/loss outcomes, trigger ads
    finalizeMatch(won) {
        this.gameState.isPlaying = false;
        clearInterval(this.timerInterval);
        this.musicAudio.pause();

        if (won) {
            this.playSFX('win');
            document.getElementById('result-title').innerText = "VICTORY!";
            document.getElementById('result-title').style.color = 'var(--accent-green)';
            
            const timeElapsedSec = Math.floor((Date.now() - this.gameState.matchStartTime) / 1000);
            document.getElementById('result-description').innerText = `Amazing! You decoded the secret pattern in ${this.gameState.guessesUsed} rounds (${timeElapsedSec}s)!`;
            
            // Record stats locally
            this.saveSolveStats(this.gameState.guessesUsed, true);

            if (this.gameState.mode === 'daily') {
                const completed = JSON.parse(localStorage.getItem('lineitup_daily_completed') || '[]');
                if (!completed.includes(this.activeDailyChallengeDate)) {
                    completed.push(this.activeDailyChallengeDate);
                    localStorage.setItem('lineitup_daily_completed', JSON.stringify(completed));
                }
            }
        } else {
            this.playSFX('loss');
            document.getElementById('result-title').innerText = "DEFEAT!";
            document.getElementById('result-title').style.color = 'var(--accent-red)';
            document.getElementById('result-description').innerText = `You ran out of attempts! Better luck next time.`;
            
            this.saveSolveStats(8, false);
        }

        // Render target reveal sequence cards in Modal
        this.renderSecretRevealModal();

        // Show ads after each match (with remove ads verification)
        Platform.showInterstitial(() => {
            console.log("[GameEngine] Interstitial complete. Showing result modal.");
            document.getElementById('match-end-modal').classList.add('active');
        });
    }

    renderSecretRevealModal() {
        const header = document.getElementById('result-reveal-header');
        if (header) {
            if (this.gameState.mode === 'solo' || this.gameState.mode === 'multiplayer' || this.gameState.mode === 'daily') {
                const categoryFormatted = this.gameState.mode === 'daily' ? 'DAILY' : this.gameState.category.replace('_', ' ').toUpperCase();
                header.innerText = `Secret Sequence (Category: ${categoryFormatted})`;
            } else {
                header.innerText = `Secret Sequence (Color Bottles)`;
            }
        }

        const container = document.getElementById('secret-reveal-container');
        container.innerHTML = '';

        this.gameState.secretSequence.forEach(item => {
            const card = document.createElement('div');
            card.className = 'reveal-card';
            
            if (this.gameState.mode === 'solo' || this.gameState.mode === 'multiplayer' || this.gameState.mode === 'daily') {
                const imgSrc = this.gameState.mode === 'daily' ? item.imageUrl : `assets/icons/${this.gameState.category}/${item.icon}`;
                card.innerHTML = `
                    <img src="${imgSrc}" alt="${item.name}" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${item.name}'">
                    <span>${item.name}</span>
                `;
            } else if (this.gameState.mode === 'bottle') {
                card.innerHTML = `
                    <div style="width: 36px; height: 75px; border: 2.5px solid var(--border-dark); border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; background: ${item.gradient}; box-shadow: inset -4px 0 0 rgba(255,255,255,0.3);"></div>
                    <span>${item.name}</span>
                `;
            }
            container.appendChild(card);
        });
    }

    handleForfeit() {
        this.gameState.isPlaying = false;
        clearInterval(this.timerInterval);
        this.musicAudio.pause();

        if (this.gameState.mode === 'multiplayer') {
            this.sendP2PMessage({ type: 'forfeit' });
            this.closeP2PConnection();
        }

        this.returnToLobbyScreen();
    }

    returnToLobbyScreen() {
        document.getElementById('gameplay-panel').classList.remove('active');
        document.getElementById('lobby-panel').classList.add('active');
        
        // Refresh display components
        this.renderStatsLobby();
        this.renderLeaderboardLobby();

        if (this.gameState.mode === 'daily') {
            this.loadDailyChallengesTab();
        }
    }

    // ==========================================================================
    // MULTIPLAYER DATA CHANNEL WEBRTC ENGINE (PEERJS)
    // ==========================================================================

    initializeHostLobby() {
        document.getElementById('host-peer-id-text').innerText = "Generating ID...";
        document.getElementById('invite-link-input').value = "";
        document.getElementById('host-lobby-modal').classList.add('active');

        this.isHost = true;
        this.networkRole = 'host';

        try {
            // Instantiate PeerJS client - using default open Peer server
            this.peer = new Peer({
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log(`[P2P] Peer open. Local Peer ID: ${id}`);
                this.gameState.lobbyId = id;
                document.getElementById('host-peer-id-text').innerText = id;
                
                // Formulate Direct WebRTC Join Invite link
                const inviteUrl = window.location.origin + window.location.pathname + "?join=" + id;
                document.getElementById('invite-link-input').value = inviteUrl;
            });

            this.peer.on('connection', (connection) => {
                console.log("[P2P] Incoming connection received!");
                this.conn = connection;
                this.setupDataChannelListeners();
            });

            this.peer.on('error', (err) => {
                console.error("[P2P] PeerJS general error:", err);
                alert(`P2P Network error: ${err.message}`);
                this.closeP2PHostLobby();
            });

        } catch (e) {
            console.error("[P2P] Failed to host:", e);
            alert("Error establishing P2P peer lobby.");
            this.closeP2PHostLobby();
        }
    }

    connectToHostPeer(targetId) {
        console.log(`[P2P] Attempting to connect to host: ${targetId}`);
        this.isHost = false;
        this.networkRole = 'client';

        // Show connecting loader text on Join button
        const joinBtn = document.getElementById('join-match-btn');
        joinBtn.disabled = true;
        joinBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';

        try {
            this.peer = new Peer({ debug: 1 });

            this.peer.on('open', (myId) => {
                console.log(`[P2P] Client Peer open with ID: ${myId}. Connecting to host...`);
                this.conn = this.peer.connect(targetId, {
                    reliable: true
                });
                
                this.setupDataChannelListeners();
            });

            this.peer.on('error', (err) => {
                console.error("[P2P] Connection peer error:", err);
                alert(`Failed to connect to lobby peer. Please verify ID is correct.`);
                joinBtn.disabled = false;
                joinBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Join';
            });

        } catch (e) {
            console.error("[P2P] Client instantiate failed:", e);
            joinBtn.disabled = false;
            joinBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Join';
        }
    }

    setupDataChannelListeners() {
        this.conn.on('open', () => {
            console.log("[P2P] Peer WebRTC connection fully opened and ready!");
            this.peerConnected = true;
            
            // Hide host modal if active
            document.getElementById('host-lobby-modal').classList.remove('active');
            
            // Restore Join Button status
            const joinBtn = document.getElementById('join-match-btn');
            if (joinBtn) {
                joinBtn.disabled = false;
                joinBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Join';
            }

            // Step 1: Exchange Profiles (Handshake)
            this.sendP2PMessage({
                type: 'handshake',
                username: this.profile.username,
                avatar: this.profile.avatar
            });
        });

        this.conn.on('data', (data) => {
            console.log("[P2P] Received Message Payload:", data);
            this.handleP2PIncomingMessage(data);
        });

        this.conn.on('close', () => {
            console.log("[P2P] Connection closed by remote user.");
            this.handlePeerDisconnected();
        });

        this.conn.on('error', (err) => {
            console.error("[P2P] Connection channel error:", err);
            this.handlePeerDisconnected();
        });
    }

    sendP2PMessage(msg) {
        if (this.conn && this.peerConnected) {
            this.conn.send(msg);
        }
    }

    handleP2PIncomingMessage(data) {
        switch (data.type) {
            case 'handshake':
                this.opponentProfile.username = data.username || 'Opponent';
                this.opponentProfile.avatar = data.avatar || 'person_ponytail';
                
                // Update VS pill graphics
                document.getElementById('player-vs-avatar').src = `assets/icons/people/${this.profile.avatar}.png`;
                document.getElementById('player-vs-name').innerText = this.profile.username;
                
                document.getElementById('opponent-vs-avatar').src = `assets/icons/people/${this.opponentProfile.avatar}.png`;
                document.getElementById('opponent-vs-name').innerText = this.opponentProfile.username;

                // Host coordinates match setup
                if (this.isHost) {
                    this.setupAndStartHostMultiplayer();
                }
                break;

            case 'start_match':
                // Client starts game using details generated by Host
                this.gameState.secretSequence = data.secretSequence;
                this.gameState.boardState = data.boardState;
                this.gameState.category = data.category;
                
                this.startNewGame('multiplayer', data.category);
                this.renderBoardSlots();
                break;

            case 'submit_guess':
                // Remote opponent submitted their guess
                this.opponentSubmitted = true;
                this.opponentLastGuess = data;
                
                // Append their records instantly in Opponent scroll
                this.appendHistoryItem('opponent-history-list', data.round, data.correct);
                
                // Check if user has also submitted, so we can advance
                this.evaluateMultiplayerRoundSync();
                break;

            case 'forfeit':
                alert(`${this.opponentProfile.username} has forfeited the match! You win by default.`);
                this.finalizeMatch(true);
                break;

            case 'rematch_offer':
                this.playSFX('win');
                if (confirm(`${this.opponentProfile.username} offers a rematch! Do you accept?`)) {
                    this.sendP2PMessage({ type: 'rematch_accept' });
                    // Host sets up another game
                    if (this.isHost) {
                        this.setupAndStartHostMultiplayer();
                    }
                }
                break;

            case 'rematch_accept':
                console.log("[P2P] Rematch accepted!");
                break;
        }
    }

    // Host picks random category and initial boards, shares it P2P
    setupAndStartHostMultiplayer() {
        const categories = ['animals', 'foods', 'objects', 'people', 'places', 'space', 'water_animals'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Build cards
        const dataset = CATEGORIES_DATA[randomCategory];
        const pool = [...dataset];
        const secret = [];
        for (let i = 0; i < 5; i++) {
            const randIdx = Math.floor(Math.random() * pool.length);
            secret.push(pool.splice(randIdx, 1)[0]);
        }

        // Shuffle starting boards
        let shuffled = [...secret];
        let attempts = 0;
        while (attempts < 10) {
            shuffled.sort(() => Math.random() - 0.5);
            let correct = 0;
            for (let i = 0; i < 5; i++) {
                if (shuffled[i].name === secret[i].name) correct++;
            }
            if (correct < 5) break;
            attempts++;
        }

        this.gameState.secretSequence = secret;
        this.gameState.boardState = shuffled;
        this.gameState.category = randomCategory;

        // Broadcast starting packet to client
        this.sendP2PMessage({
            type: 'start_match',
            category: randomCategory,
            secretSequence: secret,
            boardState: shuffled
        });

        this.startNewGame('multiplayer', randomCategory);
        this.renderBoardSlots();
    }

    handleMultiplayerGuessSubmit(guessInfo) {
        // Freeze GUI submit until opponent catches up
        document.getElementById('submit-guess-btn').disabled = true;
        document.getElementById('waiting-overlay-bar').style.display = 'block';

        // Clear turn countdown timer interval
        clearInterval(this.timerInterval);

        // Share guess state with Peer
        this.sendP2PMessage({
            type: 'submit_guess',
            round: this.gameState.guessHistory.length,
            correct: guessInfo.correct
        });

        // Run evaluation checks
        this.evaluateMultiplayerRoundSync();
    }

    evaluateMultiplayerRoundSync() {
        const myLastGuess = this.gameState.guessHistory[this.gameState.guessHistory.length - 1];
        
        // We need both players to have submitted their guesses for the current round
        if (!myLastGuess || !this.opponentSubmitted) {
            console.log("[P2P] Waiting for opponent guess submission...");
            return;
        }

        // Both players are now synced for this round
        console.log("[P2P] Evaluating round results simultaneously!");
        
        // Hide wait spinner, enable buttons
        document.getElementById('waiting-overlay-bar').style.display = 'none';
        document.getElementById('submit-guess-btn').disabled = false;
        document.getElementById('guesses-remaining').innerText = this.gameState.guessesRemaining;

        const myCorrect = myLastGuess.correct;
        const oppCorrect = this.opponentLastGuess.correct;

        // Reset sync controls
        this.opponentSubmitted = false;

        // Check if either player got 5/5
        const myWin = myCorrect === 5;
        const oppWin = oppCorrect === 5;

        if (myWin && oppWin) {
            // Both solved - Tie match
            this.gameState.isPlaying = false;
            clearInterval(this.timerInterval);
            this.musicAudio.pause();
            this.playSFX('win');
            
            document.getElementById('result-title').innerText = "TIE MATCH!";
            document.getElementById('result-title').style.color = 'var(--accent-yellow)';
            document.getElementById('result-description').innerText = `Amazing! Both you and ${this.opponentProfile.username} cracked the pattern at the exact same round!`;
            
            this.saveSolveStats(this.gameState.guessesUsed, true);
            this.renderSecretRevealModal();
            document.getElementById('match-end-modal').classList.add('active');
        } else if (myWin) {
            // I win
            this.finalizeMatch(true);
            // Record Ranked win in stats
            let rankedWins = parseInt(localStorage.getItem('lineitup_wins') || '0');
            localStorage.setItem('lineitup_wins', rankedWins + 1);
        } else if (oppWin) {
            // Opponent wins
            this.finalizeMatch(false);
        } else if (this.gameState.guessesRemaining <= 0) {
            // Out of guesses, tie / lose
            this.finalizeMatch(false);
        } else {
            // Continue to next round, restart turn timer
            this.playSFX('click');
            this.setupGameplayTimer();
        }
    }

    offerMultiplayerRematch() {
        console.log("[P2P] Offering rematch to opponent...");
        this.sendP2PMessage({ type: 'rematch_offer' });
        alert("Rematch offer sent! Waiting for opponent response...");
    }

    handlePeerDisconnected() {
        if (this.gameState.isPlaying) {
            alert("The connection to the other player was lost! Match ended.");
            this.handleForfeit();
        } else {
            alert("Disconnected from P2P Lobby.");
        }
        this.closeP2PConnection();
    }

    closeP2PHostLobby() {
        document.getElementById('host-lobby-modal').classList.remove('active');
        this.closeP2PConnection();
    }

    closeP2PConnection() {
        this.peerConnected = false;
        if (this.conn) {
            try { this.conn.close(); } catch(e) {}
            this.conn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch(e) {}
            this.peer = null;
        }
    }

    // Read "?join=ID" query string on page load to join lobbies instantly
    checkForInviteLink() {
        const params = new URLSearchParams(window.location.search);
        const joinId = params.get('join');
        if (joinId && joinId.trim() !== '') {
            console.log(`[P2P] Dynamic invite code detected in URL: ${joinId}`);
            
            // Switch to P2P Tab
            document.querySelectorAll('.tab-btn').forEach(b => {
                if (b.getAttribute('data-tab') === 'multiplayer-panel') b.classList.add('active');
                else b.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach(c => {
                if (c.id === 'multiplayer-panel') c.classList.add('active');
                else c.classList.remove('active');
            });

            // Populate peer input & trigger connection
            document.getElementById('join-peer-id-input').value = joinId;
            setTimeout(() => {
                this.connectToHostPeer(joinId);
            }, 800);
        }
    }

    // ==========================================================================
    // STATISTICS & LOCAL STORAGE PERFORMANCE
    // ==========================================================================

    saveSolveStats(guesses, won) {
        let totalPlayed = parseInt(localStorage.getItem('lineitup_played') || '0');
        totalPlayed++;
        localStorage.setItem('lineitup_played', totalPlayed.toString());

        if (won) {
            let guessHistory = JSON.parse(localStorage.getItem('lineitup_history') || '[]');
            guessHistory.push(guesses);
            localStorage.setItem('lineitup_history', JSON.stringify(guessHistory));
            
            // Submit best score to the platform (CrazyGames / local mock)
            // Low guesses count is better in this game
            Platform.submitScore('standard_solo', guesses);
        }
    }

    renderStatsLobby() {
        const totalPlayed = parseInt(localStorage.getItem('lineitup_played') || '0');
        const wins = parseInt(localStorage.getItem('lineitup_wins') || '0');
        const guessHistory = JSON.parse(localStorage.getItem('lineitup_history') || '[]');

        let avg = '-';
        if (guessHistory.length > 0) {
            const sum = guessHistory.reduce((a, b) => a + b, 0);
            avg = (sum / guessHistory.length).toFixed(1);
        }

        let winRate = '0%';
        if (totalPlayed > 0) {
            winRate = ((wins / totalPlayed) * 100).toFixed(0) + '%';
        }

        document.getElementById('stats-solo-avg').innerText = avg;
        document.getElementById('stats-total-played').innerText = totalPlayed;
        document.getElementById('stats-wins').innerText = wins;
        document.getElementById('stats-win-rate').innerText = winRate;
    }

    renderLeaderboardLobby() {
        const body = document.getElementById('leaderboard-body');
        if (!body) return;

        body.innerHTML = '';
        
        // Fetch leaderboard scores from Platform layer (reads CrazyGames SDK/Local fallback)
        const scores = Platform.getLeaderboard('standard_solo');

        // Add mock bots in empty standalone state so it looks super alive and competitive!
        if (scores.length === 0) {
            const mockScores = [
                { name: 'ComicCody', score: 3, date: '2026-06-01' },
                { name: 'XanderDevelops', score: 4, date: '2026-05-31' },
                { name: 'RetroRacer', score: 5, date: '2026-06-02' },
                { name: 'PixelPalette', score: 5, date: '2026-05-29' }
            ];
            localStorage.setItem('lineitup_leaderboard_standard_solo', JSON.stringify(mockScores));
            this.renderLeaderboardLobby();
            return;
        }

        scores.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${idx + 1}</strong></td>
                <td class="player-link" style="cursor: pointer; color: var(--accent-blue); text-decoration: underline; font-weight: 600;">${entry.name}</td>
                <td>${entry.score} Guesses</td>
                <td>${entry.date}</td>
            `;
            // Make user clickable to inspect their personal performance statistics!
            tr.querySelector('.player-link').addEventListener('click', () => {
                this.inspectPlayerLeaderboardStats(entry.name);
            });
            body.appendChild(tr);
        });
    }

    // Modal inspect stats logic
    inspectPlayerLeaderboardStats(playerName) {
        this.playSFX('click');
        
        document.getElementById('view-stats-player-name').innerText = `Profile: ${playerName}`;
        
        // Generate nice mock statistics if it is not the current user
        if (playerName === this.profile.username) {
            const totalPlayed = parseInt(localStorage.getItem('lineitup_played') || '0');
            const guessHistory = JSON.parse(localStorage.getItem('lineitup_history') || '[]');
            let avg = '-';
            if (guessHistory.length > 0) {
                const sum = guessHistory.reduce((a, b) => a + b, 0);
                avg = (sum / guessHistory.length).toFixed(1);
            }
            document.getElementById('view-stats-solo-avg').innerText = avg;
            document.getElementById('view-stats-total').innerText = totalPlayed;
        } else {
            // Generate stable mock profile data based on username seed
            const hash = playerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const mockPlayed = 5 + (hash % 25);
            const mockAvg = (3.5 + (hash % 4.5)).toFixed(1);
            
            document.getElementById('view-stats-solo-avg').innerText = mockAvg;
            document.getElementById('view-stats-total').innerText = mockPlayed;
        }

        document.getElementById('view-stats-modal').classList.add('active');
    }

    // ==========================================================================
    // DAILY CHALLENGE BUSINESS LOGIC & AD REPLAY / PREMIUM LIFETIME BYPASS
    // ==========================================================================

    async loadDailyChallengesTab() {
        console.log("[DailyChallenge] Loading Daily tab...");
        this.updateDailyPremiumBanner();
        
        try {
            // Calculate past 7 days' date strings
            const dates = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                dates.push(dateStr);
            }
            
            // Query Daily Challenges from Supabase RLS public read
            const { data, error } = await this.supabase
                .from('line_it_up_daily_challenges')
                .select('*')
                .in('challenge_date', dates)
                .order('challenge_date', { ascending: false });
                
            if (error) throw error;
            
            this.dailyChallengesMap = {};
            if (data && data.length > 0) {
                data.forEach(ch => {
                    this.dailyChallengesMap[ch.challenge_date] = ch;
                });
            }
            
            this.renderDailyCalendar(dates);
            
        } catch (e) {
            console.error("[DailyChallenge] Failed to load challenges:", e);
            const placeholder = document.getElementById('no-challenges-placeholder');
            placeholder.style.display = 'block';
            placeholder.innerText = "Error loading daily challenges: " + e.message;
            document.getElementById('selected-day-details').style.display = 'none';
        }
    }

    updateDailyPremiumBanner() {
        const isPremium = localStorage.getItem('lineitup_daily_premium') === 'true';
        const banner = document.getElementById('daily-premium-banner');
        const buyBtn = document.getElementById('buy-daily-premium-btn');
        
        if (isPremium) {
            banner.classList.add('unlocked');
            banner.querySelector('strong').innerText = 'Premium Active 👑';
            banner.querySelector('span').innerText = 'You have unlimited access to all past challenges and zero replay cooldowns!';
            buyBtn.style.display = 'none';
        } else {
            banner.classList.remove('unlocked');
            banner.querySelector('strong').innerText = 'Premium Challenge Access';
            banner.querySelector('span').innerText = 'Play all past days\' challenges & bypass all replay cooldowns instantly!';
            buyBtn.style.display = 'block';
        }
    }

    renderDailyCalendar(dates) {
        const grid = document.getElementById('daily-calendar-grid');
        grid.innerHTML = '';
        
        const selectedDate = this.selectedDailyDate || dates[0];
        const completedList = JSON.parse(localStorage.getItem('lineitup_daily_completed') || '[]');
        let firstAvailableChallenge = null;
        
        dates.forEach(dateStr => {
            const challenge = this.dailyChallengesMap[dateStr];
            const isCompleted = completedList.includes(dateStr);
            
            const btn = document.createElement('button');
            btn.className = `calendar-day-btn ${dateStr === selectedDate ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
            
            // Format dates
            const dateParts = dateStr.split('-');
            const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dateStr === dates[0] ? 'Today' : (dateStr === dates[1] ? 'Yest' : dayNames[dateObj.getDay()]);
            const monthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            
            btn.innerHTML = `
                <span class="calendar-day-name">${dayName}</span>
                <span class="calendar-day-date">${monthDay}</span>
            `;
            
            if (!challenge) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'default';
                btn.title = "No challenge today";
            } else {
                if (!firstAvailableChallenge) firstAvailableChallenge = challenge;
                btn.addEventListener('click', () => {
                    this.playSFX('click');
                    this.selectedDailyDate = dateStr;
                    document.querySelectorAll('.calendar-day-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.showDailyChallengeDetails(challenge);
                });
            }
            
            grid.appendChild(btn);
        });
        
        // Auto-select the first available if not set
        if (!this.selectedDailyDate && firstAvailableChallenge) {
            this.selectedDailyDate = firstAvailableChallenge.challenge_date;
            this.showDailyChallengeDetails(firstAvailableChallenge);
        } else if (this.selectedDailyDate && this.dailyChallengesMap[this.selectedDailyDate]) {
            this.showDailyChallengeDetails(this.dailyChallengesMap[this.selectedDailyDate]);
        } else {
            document.getElementById('no-challenges-placeholder').style.display = 'block';
            document.getElementById('selected-day-details').style.display = 'none';
        }
    }

    showDailyChallengeDetails(challenge) {
        document.getElementById('no-challenges-placeholder').style.display = 'none';
        
        const detailsCard = document.getElementById('selected-day-details');
        detailsCard.style.display = 'block';
        
        const dateParts = challenge.challenge_date.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        document.getElementById('selected-day-title').innerText = formattedDate;
        document.getElementById('selected-day-theme').innerText = `Theme: ${challenge.theme}`;
        document.getElementById('selected-day-desc').innerText = challenge.order_description || "Arrange the square sliced images in the correct hidden logical order!";
        
        const completedList = JSON.parse(localStorage.getItem('lineitup_daily_completed') || '[]');
        const isCompleted = completedList.includes(challenge.challenge_date);
        const statusBadge = document.getElementById('selected-day-status');
        
        if (isCompleted) {
            statusBadge.innerText = 'Completed';
            statusBadge.className = 'challenge-badge status-badge completed';
        } else {
            statusBadge.innerText = 'Uncompleted';
            statusBadge.className = 'challenge-badge status-badge';
        }
        
        this.updateDailyActionArea(challenge, isCompleted);
    }

    updateDailyActionArea(challenge, isCompleted) {
        const isPremium = localStorage.getItem('lineitup_daily_premium') === 'true';
        const playBtn = document.getElementById('play-daily-btn');
        const adReplayArea = document.getElementById('daily-ad-replay-area');
        const cooldownArea = document.getElementById('daily-cooldown-area');
        
        if (this.dailyCooldownInterval) {
            clearInterval(this.dailyCooldownInterval);
            this.dailyCooldownInterval = null;
        }
        
        if (!isCompleted) {
            playBtn.style.display = 'block';
            playBtn.innerText = 'Play Challenge';
            adReplayArea.style.display = 'none';
            cooldownArea.style.display = 'none';
            
            playBtn.onclick = () => {
                this.playSFX('click');
                this.startDailyChallenge(challenge);
            };
        } else {
            if (isPremium) {
                playBtn.style.display = 'block';
                playBtn.innerText = 'Replay Challenge (Premium)';
                adReplayArea.style.display = 'none';
                cooldownArea.style.display = 'none';
                
                playBtn.onclick = () => {
                    this.playSFX('click');
                    this.startDailyChallenge(challenge);
                };
            } else {
                const remainingCooldownMs = this.getDailyAdCooldownRemaining();
                if (remainingCooldownMs > 0) {
                    playBtn.style.display = 'none';
                    adReplayArea.style.display = 'none';
                    cooldownArea.style.display = 'block';
                    
                    this.runDailyCooldownTimer(challenge, remainingCooldownMs);
                } else {
                    playBtn.style.display = 'none';
                    adReplayArea.style.display = 'block';
                    cooldownArea.style.display = 'none';
                    
                    const adReplayBtn = document.getElementById('replay-daily-ad-btn');
                    adReplayBtn.onclick = () => {
                        this.playSFX('click');
                        this.watchDailyAdReplay(challenge);
                    };
                }
            }
        }
    }

    getDailyAdCooldownRemaining() {
        const cooldownStart = parseInt(localStorage.getItem('lineitup_daily_cooldown_start') || '0');
        if (!cooldownStart) return 0;
        
        const elapsed = Date.now() - cooldownStart;
        const cooldownDuration = 10 * 60 * 1000;
        return Math.max(0, cooldownDuration - elapsed);
    }

    runDailyCooldownTimer(challenge, initialRemainingMs) {
        let remaining = initialRemainingMs;
        const timerLabel = document.getElementById('daily-cooldown-timer');
        
        const updateTimerText = (ms) => {
            const totalSec = Math.ceil(ms / 1000);
            const minutes = Math.floor(totalSec / 60);
            const seconds = totalSec % 60;
            timerLabel.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateTimerText(remaining);
        
        this.dailyCooldownInterval = setInterval(() => {
            remaining -= 1000;
            if (remaining <= 0) {
                clearInterval(this.dailyCooldownInterval);
                this.dailyCooldownInterval = null;
                this.updateDailyActionArea(challenge, true);
            } else {
                updateTimerText(remaining);
            }
        }, 1000);
    }

    watchDailyAdReplay(challenge) {
        Platform.showRewarded(
            () => {
                console.log("[DailyChallenge] Ad watched successfully. Starting replay.");
                localStorage.setItem('lineitup_daily_cooldown_start', Date.now().toString());
                this.startDailyChallenge(challenge);
            },
            () => {
                console.log("[DailyChallenge] Ad reward was cancelled.");
            }
        );
    }

    startDailyChallenge(challenge) {
        console.log(`[GameEngine] Starting Daily Challenge: ${challenge.challenge_date}`);
        
        this.gameState.isPlaying = true;
        this.gameState.mode = 'daily';
        this.gameState.category = 'daily';
        this.gameState.guessesRemaining = 8;
        this.gameState.guessesUsed = 0;
        this.gameState.guessHistory = [];
        this.gameState.opponentGuessHistory = [];
        this.gameState.rewardedAdUsed = false;
        this.gameState.selectedSlotIndex = null;
        this.gameState.matchStartTime = Date.now();
        this.opponentSubmitted = false;
        this.activeDailyChallengeDate = challenge.challenge_date;

        document.getElementById('player-history-list').innerHTML = '';
        document.getElementById('opponent-history-list').innerHTML = '';
        document.getElementById('guesses-remaining').innerText = '8';
        document.getElementById('waiting-overlay-bar').style.display = 'none';
        document.getElementById('submit-guess-btn').disabled = false;

        document.getElementById('gameplay-mode-label').innerText = 'Daily Challenge';
        document.getElementById('gameplay-topic-label').innerText = `Theme: ${challenge.theme}`;
        document.getElementById('opponent-history-wrapper').style.display = 'none';
        document.getElementById('multiplayer-vs-pill').style.display = 'none';

        // Map database challenge items into game engine layout items.
        // Older or incomplete admin saves can have a null image_path; Supabase's
        // getPublicUrl expects a string, so guard before calling it.
        const secret = (challenge.items || []).map(item => {
            const name = item?.name || 'Mystery Card';
            const imagePath = typeof item?.image_path === 'string' ? item.image_path.trim() : '';
            const fallbackImageUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
            const imageUrl = item?.image_url || (imagePath
                ? this.supabase.storage.from('daily-challenge').getPublicUrl(imagePath).data.publicUrl
                : fallbackImageUrl);

            return {
                name,
                correct_index: Number(item?.correct_index ?? 0),
                icon: imagePath,
                imageUrl
            };
        });

        this.gameState.secretSequence = [...secret];

        let shuffled = [...secret];
        let attempts = 0;
        while (attempts < 10) {
            shuffled.sort(() => Math.random() - 0.5);
            let correctCount = 0;
            for (let i = 0; i < 5; i++) {
                if (shuffled[i].name === this.gameState.secretSequence[i].name) correctCount++;
            }
            if (correctCount < 5) break;
            attempts++;
        }

        this.gameState.boardState = shuffled;
        this.renderBoardSlots();

        document.getElementById('lobby-panel').classList.remove('active');
        document.getElementById('gameplay-panel').classList.add('active');

        if (!this.isMuted) {
            this.musicAudio.currentTime = 0;
            this.musicAudio.play().catch(e => {});
        }

        this.setupGameplayTimer();
    }
}

// Instantiate global Game engine when document resources load
window.addEventListener('load', () => {
    window.Game = new LineItUpGame();
    window.Game.init();
});

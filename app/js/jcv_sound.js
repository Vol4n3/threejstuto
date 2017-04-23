(function (exports) {
    "use strict";
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var context = new AudioContext();

    class ListSounds{
        /**
         * 
         * @param {Object} sounds 
         */
        constructor(... sounds){
            this.sounds = {};
            for(var i in sounds){
                var sound = new Sound(sounds[i].url);
                this.sounds[sounds[i].name] = sound;
            }
        }
        /**
         * 
         * @param {Object} sound 
         */
        add(sound){
            var s = new Sound(sound.url);
            this.sounds[sound.name];
        }
        play(name){
            this.sounds[name].play(true);
        }
    }
    class Sound {
        constructor(url, callback) {
            this.url = url;
            this.audioBuffer;
            this.callback = callback || function(){};
            this.source;
            this.playing = false;
            this.pausedAt;
            this.startedAt;
            this.init();
        }
        init() {
            var req = new XMLHttpRequest();
            req.open('get', this.url);
            req.responseType = 'arraybuffer';
            req.addEventListener('load', function (e) {
                context.decodeAudioData(req.response, function (buffer) {
                    this.audioBuffer = buffer;
                    this.ready = true;
                    this.callback(this);
                }.bind(this));
            }.bind(this));
            req.send();
        }
        play(atStart) {
            if (this.ready) {
                this.source = context.createBufferSource();
                this.gainNode = context.createGain();
                this.source.buffer = this.audioBuffer;
                this.source.connect(this.gainNode);
                this.gainNode.connect(context.destination);
                this.gainNode.gain.value = 0.2;
                this.playing = true;
                if (this.pausedAt && !atStart) {
                    this.startedAt = Date.now() - this.pausedAt;
                    this.source.start(0, this.pausedAt / 1000);
                }
                else {
                    this.startedAt = Date.now();
                    this.source.start(0);
                }
            }

        }
        stop() {
            if (this.ready) {
                this.source.stop(0);
                this.pausedAt = Date.now() - this.startedAt;
                this.playing = false;
            }
        };
        toggle() {
            if (this.ready) {
                this.playing ? this.stop() : this.play(true);
            }
        }
    }
    exports.load = Sound;
    exports.list = ListSounds;
})(window.jcv_sound = window.jcv_sound || {})
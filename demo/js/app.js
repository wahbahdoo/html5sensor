var demo = {
    
    /* uninitialized canvas drawing elements */
    ctx: null,       /* 2d context of canvas */
    img: null,       /* source image to draw onto canvas */
    
    /* uninitialized coordinates */
    imgSrcWidth: 0,  /* width of original image */
    imgSrcHeight: 0, /* height of original image */
    imgWidth: 0,     /* width of drawn image */
    imgHeight: 0,    /* height of drawn image */
    imgX1: 0,        /* x coordinate of left edge of drawn main image */
    imgX2: 0,        /* x coordinate of right edge of drawn main image */
    imgY1: 0,        /* y coordinate of top edge of drawn main image */
    imgY2: 0,        /* y coordinate of top edge of drawn main image */
    
    /* uninitialized reflections */
    reflections: [],
    
    /* initialization */
    start: function() {
        /* get 2d context of canvas */
        demo.ctx = document.getElementById('demoCanvas').getContext('2d');
        /* set canvas size to full screen */
        demo.ctx.canvas.width  = window.innerWidth;
        demo.ctx.canvas.height = window.innerHeight;
        /* initialize source image */
        demo.img = new Image();
        /* handler for when image is loaded & ready to be drawn */
        demo.img.onload = function () {
            /* calculate coordinates of image */
            demo.calcCoords(demo.ctx.canvas.width, demo.ctx.canvas.height, this.width, this.height);
            /* draw image onto canvas */
            demo.ctx.drawImage(demo.img, demo.imgX1, demo.imgY1, demo.imgWidth, demo.imgHeight);
            /* initialize reflections */
            demo.initReflections();
            /* set opacity for reflections */
            demo.ctx.globalAlpha = 0.5;
            /* listen for orientation changes */
            window.addEventListener('deviceorientation', demo.reflect, false);
        }
        /* load image */
        demo.img.src = "imgs/orangutan.jpg";
    },
    
    /* reflect image toward tilted direction */
    reflect: function(event) {
        /* filter out noise (changes < 5 degrees) */
        var filterFactor = 5;
        var beta = Math.floor(event.beta / filterFactor) * filterFactor;
        var gamma = Math.floor(event.gamma / filterFactor) * filterFactor;
        /* send orientation change event to all reflection tiles */
        for (var i = 0; i < demo.reflections.length; i++) {
            demo.reflections[i].onTilt.call(demo.reflections[i], beta, gamma);
        }
    },
    
    /* draw given fraction of image reflection */
    drawReflection: function(transform, offsetX, lengthX, offsetY, lengthY) {
        /* TODO: can probably be smarter and keep state so that we don't always clear and redraw */
        demo.clearReflection(transform);
        demo.ctx.drawImage(demo.img, demo.imgSrcWidth * offsetX, demo.imgSrcHeight * offsetY, demo.imgSrcWidth * lengthX, demo.imgSrcHeight * lengthY, 
                           demo.imgX1 + demo.imgWidth * offsetX, demo.imgY1 + demo.imgHeight * offsetY, demo.imgWidth * lengthX, demo.imgHeight * lengthY);
    },
    
    /* clear entire image reflection */
    clearReflection: function(transform) {
        demo.ctx.setTransform.apply(demo.ctx, transform);
        demo.ctx.clearRect(demo.imgX1, demo.imgY1, demo.imgWidth, demo.imgHeight);
    },
    
    /* calculate scaling factor to enable largest image to fit on canvas w/o distorting aspepct ratio and leaving room for reflection */
    calcCoords: function(canvasWidth, canvasHeight, imgWidth, imgHeight) {
        var scale = Math.max(imgWidth / (canvasWidth / 3), imgHeight / (canvasHeight / 3));
        demo.imgSrcWidth = imgWidth;
        demo.imgSrcHeight = imgHeight;
        demo.imgWidth = imgWidth / scale;
        demo.imgHeight = imgHeight / scale;
        demo.imgX1 = (canvasWidth - demo.imgWidth) / 2;
        demo.imgY1 = (canvasHeight - demo.imgHeight) / 2;
        demo.imgX2 = demo.imgX1 + demo.imgWidth;
        demo.imgY2 = demo.imgY1 + demo.imgHeight;
    },
    
    /* initialize reflections: 9 tiles of image reflected in each direction, each displaying dynamically based on tilt */
    initReflections: function() {
        /* top reflection */
        demo.reflections.push(new Reflection(
            { betaMin: -90, betaMax: -1, gammaMin: -45, gammaMax: 45 },
            [1, 0, 0, -1, 0, demo.imgY1 * 2]
        ));
        /* top right reflection */
        demo.reflections.push(new Reflection(
            { betaMin: -90, betaMax: -1, gammaMin: 1, gammaMax: 90 },
            [-1, 0, 0, -1, (demo.imgX1 + demo.imgWidth) * 2, demo.imgY1 * 2]
        ));
        /* right reflection */
        demo.reflections.push(new Reflection(
            { betaMin: -45, betaMax: 45, gammaMin: 1, gammaMax: 90 },
            [-1, 0, 0, 1, (demo.imgX1 + demo.imgWidth) * 2, 0]
        ));
        /* bottom right reflection */
        demo.reflections.push(new Reflection(
            { betaMin: 1, betaMax: 90, gammaMin: 1, gammaMax: 90 },
            [-1, 0, 0, -1, (demo.imgX1 + demo.imgWidth) * 2, (demo.imgY1 + demo.imgHeight) * 2]
        ));
        /* bottom reflection */
        demo.reflections.push(new Reflection(
            { betaMin: 1, betaMax: 90, gammaMin: -45, gammaMax: 45 },
            [1, 0, 0, -1, 0, (demo.imgY1 + demo.imgHeight) * 2]
        ));
        /* bottom left reflection */
        demo.reflections.push(new Reflection(
            { betaMin: 1, betaMax: 90, gammaMin: -90, gammaMax: -1 },
            [-1, 0, 0, -1, demo.imgX1 * 2, (demo.imgY1 + demo.imgHeight) * 2]
        ));
        /* left reflection */
        demo.reflections.push(new Reflection(
            { betaMin: -45, betaMax: 45, gammaMin: -90, gammaMax: -1 },
            [-1, 0, 0, 1, demo.imgX1 * 2, 0]
        ));
        /* top left reflection */
        demo.reflections.push(new Reflection(
            { betaMin: -90, betaMax: -1, gammaMin: -90, gammaMax: -1 },
            [-1, 0, 0, -1, demo.imgX1 * 2, demo.imgY1 * 2]
        ));
    }
};

/* object that manages one tile of reflection */
function Reflection(tiltRange, canvasTransform) {
    /* device tilt ranges to care about */
    /* param: betaMin, betaMax, gammaMin, gammaMax */ 
    for (param in tiltRange) {
        this[param] = tiltRange[param];
    }
    /* transform matrix for canvas context */
    /* param: m11, m12, m21, m22, dx, dy */
    for (param in canvasTransform) {
        this.transform = canvasTransform;
    }
};

/* handler for change in device orientation */
Reflection.prototype.onTilt = function(beta, gamma) {
    if (this.shouldDraw(beta, gamma)) {
        var x = this.calcDimension('gamma', gamma);
        var y = this.calcDimension('beta', beta);
        demo.drawReflection(this.transform, x.offset, x.len, y.offset, y.len);
    } else {
        demo.clearReflection(this.transform);
    }
};

/* whether this orientation will cause this tile of reflection to be drawn */
Reflection.prototype.shouldDraw = function(beta, gamma) {
    return (((beta >= this.betaMin) && (beta <= this.betaMax)) && 
            ((gamma >= this.gammaMin) && (gamma <= this.gammaMax)));
};

/* calculate the dimensions of the tile to be drawn based on amount of tilt */
Reflection.prototype.calcDimension = function(param, val) { 
    if (this[param + 'Min'] == -90) {
        return { offset: 0, len: Math.abs(val / 90) };
    } else if (this[param + 'Max'] == 90) {
        return { offset: 1 - (val / 90), len: val / 90 };
    } else {
        if (val == 0) {
            return { offset: 0, len: 1 };
        } else if (val < 0) {
            return { offset: 0,  len: (val + 45) / 45 };
        } else {
            return { offset: val / 45, len: 1 - (val / 45) };
        }
    }
}

/* start demo app when dom is ready */
document.addEventListener('DOMContentLoaded', demo.start, false);

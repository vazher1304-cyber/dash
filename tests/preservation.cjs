/* Exact baseline comparison guards every original function, selector and attribute. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const originalHash='40069d7c5418e6f56bcf8ebce4c2e1001488f32940c2bf96434aa5873c0bcba0'; // cd17d81:index.html
let current=fs.readFileSync('index.html','utf8');
current=current.replace('\n<link rel="stylesheet" href="css/glass.css">','')
 .replace('\n<script type="importmap">{"imports":{"three":"./js/scene/vendor/three.module.min.js","three/addons/controls/OrbitControls.js":"./js/scene/vendor/OrbitControls.js"}}</script>','')
 .replace('\n<div id="isometric-scene" aria-hidden="true"></div>\n<div id="dashboard-overlay">','')
 .replace('</div>\n<script src="js/scene/bootstrap.js"></script>\n<script>TemplerScene.init();</script>\n</body>','</body>');
assert.equal(createHash('sha256').update(current).digest('hex'),originalHash,'Removing only the additive layer must reproduce the original document byte-for-byte');
console.log('Original document preserved: every function, vendor, style, element, ID, class, data attribute and href.');

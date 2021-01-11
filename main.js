
const { AmmoPhysics, PhysicsLoader } = ENABLE3D

let controls, time = Date.now();

const MainScene = () => {

    let animationPlaying = false;

    THREE.DefaultLoadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {


        console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

    };

    THREE.DefaultLoadingManager.onLoad = function ( ) {

        console.log( 'Loading Complete!');
        document.getElementById("timeBar").style.visibility = "visible";
        document.getElementById("loader").style.visibility = "hidden";


        startAnimation();
        // animationPlaying = true;
        // requestAnimationFrame(animate);



    };


    THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

        console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

    };

    THREE.DefaultLoadingManager.onError = function ( url ) {

        console.log( 'There was an error loading ' + url );

    };


    const instructions = document.getElementById( 'instructions' );


    const havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock ) {

        const element = document.body;

        const pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

                controls.enabled = true;


            } else {

                controls.enabled = false;

                instructions.style.display = '';

            }

        }

        const pointerlockerror = function ( event ) {

            instructions.style.display = '';

        }

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        instructions.addEventListener( 'click', function ( event ) {

            instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

            if ( /Firefox/i.test( navigator.userAgent ) ) {

                const fullscreenchange = function ( event ) {

                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                        element.requestPointerLock();
                    }

                }

                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                element.requestFullscreen();

            } else {

                element.requestPointerLock();

            }

        }, false );

    } else {

        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }

    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        'Skyboxes/GreenSky.png',
        () => {
            const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
            rt.fromEquirectangularTexture(renderer, texture);
            scene.background = rt;
        });


    let maxGameTime = 100000;
    let extraTime = 0;

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, -7, 0)

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const DPR = window.devicePixelRatio
    renderer.setPixelRatio(Math.min(2, DPR))


    // const controls = new THREE.OrbitControls(camera, renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1))
    scene.add(new THREE.AmbientLight(0x666666))
    const light = new THREE.DirectionalLight(0xdfebff, 1)
    light.position.set(50, 100, 100)
    light.position.multiplyScalar(1.3)
    scene.add(light)


    const physics = new AmmoPhysics(scene)

    physics.gravity = { x: 0, y: -10, z: 0 };
    // physics.debug.enable(true)


    const { factory } = physics

    let gun;

    function createGun(){
        const loader = new THREE.FBXLoader();
        loader.load( './guns/FBX/Pistol.fbx', object => {

            object.name = 'gun';
            object.scale.setScalar(0.001);

            object.position.x += 1;
            object.position.y -= 0.5;
            object.position.z -= 2;

            object.rotation.y += 1.5;

            object.traverse( function ( child ) {

                if( child.material ) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x2E282A,
                        emissive: true,
                        emissiveIntensity: 0.5
                    });
                }

            } );

            camera.add( object );
            gun = object;

        } );
    }

    createGun();

    const player = { box: null }

    function setCharacterBox(){
        let boxGeometry = new THREE.BoxGeometry(3, 4, 3);
        let boxMaterial = new THREE.MeshPhongMaterial({transparent: true, opacity: 0.1, color: 0x000000});
        let box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.name = 'player';
        box.position.y += 1.5;
        scene.add(box);
        physics.add.existing(box);

        box.body.setCollisionFlags(2);

        box.body.on.collision((otherObject, event) => {

            if (otherObject.name.startsWith('zombie') && !inactiveZombies[otherObject.name]) {
                extraTime-=80;
            }
        });

        player.box = box;

    }

    setCharacterBox();

    let buildingNo = 0;
    const buildings = [];

    function addBuilding(position, name, rotation=0) {
        const building = new THREE.FBXLoader();
        building.load( './buildings/Models with Materials/FBX/' + name + '.fbx', object => {

            object.name = 'building' + buildingNo++;

            object.scale.setScalar(0.05);

            object.position.x = position.x
            object.position.y = position.y + 0.5;
            object.position.z = position.z;
            object.rotateY(rotation);
            buildings.push(object);

            const compound = [
                { shape: 'box', width: 11, height: 8, depth: 11, mass: 10000000000, y: object.position.y + 3.5 }
            ]
            physics.add.existing(object, {compound});
            object.body.setCollisionFlags(2);

            scene.add( object );

        } );
    }

    const zs = [-80, -50, -20, 20, 50, 80];
    const xs = [-80, -60, -20, 20, 60, 80];

    const buildingTypes = ['1Story_Mat', '2Story_Mat', '2Story_Sign_Mat', '1Story_Sign_Mat'];
    const buildingTypesLen = buildingTypes.length;

    zs.forEach( z =>
        xs.forEach( x => {

            let randBuildingTypeIdx = Math.floor(Math.random() * buildingTypesLen)
            let rotation = z < 0 ? 0 : Math.PI;
            addBuilding({x: x, y: 0, z: z}, buildingTypes[randBuildingTypeIdx], rotation);

            }

        )
    )


    let zombieNo = 0;
    let zombies = [];
    let inactiveZombies = {};
    let maxActiveZombies = 20;
    let zombiesKilled = 0;
    let zombieHealth = 4;

    const zombieLoader = new THREE.FBXLoader();

    function addZombie(position, zombieNo, fileName) {

        const zombie = {
            object: null,
            mixer: null,
            zombieCollided: null,
            recentlyCollided: false,
            health: zombieHealth,
            active: true,
            walkAnimation: null,
            dieAnimation: null,
            deathStart: 0
        };

        if( true
            // !zombies || !zombies[0]
        ) {
            zombieLoader.load('./enemies/FBX/' + fileName + '.fbx', object => {

                object.name = 'zombie' + zombieNo;

                let mixer = new THREE.AnimationMixer(object);

                zombie.walkAnimation = object.animations[8];
                zombie.dieAnimation = object.animations[6];

                mixer.clipAction(zombie.walkAnimation).play();
                object.rotation.y = Math.PI;

                object.scale.setScalar(0.01);

                object.position.x = position.x
                object.position.y = position.y;
                object.position.z = position.z;
                object.rotation.y = 2 * Math.PI * Math.random();

                const compound = [
                    {shape: 'sphere', radius: 0.65, y: 2.5, mass: 1},
                    {shape: 'box', width: 1, height: 3, y: 1.5, depth: 0.4, mass: 1}
                ]

                physics.add.existing(object, {compound});
                object.body.setCollisionFlags(6);

                object.body.on.collision((otherObject, event) => {
                    if (otherObject.name === 'bullet' && zombie.active) {
                        zombie.health -= 1;
                        if (zombie.health <= 0) {
                            zombie.active = false;
                        }
                        bleed(zombie.object);
                        console.log('zombie hit! health: ' + zombie.health);

                    } else if (otherObject.name !== 'ground') {
                        if (zombie.zombieCollided !== otherObject &&  !zombie.recentlyCollided) {
                            let randomRotation = (0.5 - Math.random()) * Math.PI /2 + Math.PI; //
                            object.rotation.y += randomRotation;
                            zombie.zombieCollided = otherObject;
                            zombie.recentlyCollided = true;
                        }
                    }
                });
                zombie.object = object;
                zombie.mixer = mixer;

                scene.add(object);

                if (zombieNo < maxActiveZombies) zombies.push(zombie);
                else{
                    inactiveZombies[zombie.object.name] = zombie;
                    zombie.object.visible = false;
                    zombie.active = false;
                }


            });
        }

    }

    const zombieXs = [ {min: -75, max: -65}, {min: -55, max: -25}, {min: -15, max: 15}, {min: 25, max: 55},  {min: 65, max: 75} ];
    const zombieZs = [ {min: -75, max: -55}, {min: -45, max: -25}, {min: -15, max: 15}, {min: 25, max: 45},  {min: 55, max: 75} ];

    const areasNo = zombieXs.length;

    function getRandomPosition(){

        let areaXIdx = Math.floor(Math.random() * areasNo);
        let areaZIdx = Math.floor(Math.random() * areasNo);

        let x = zombieXs[areaXIdx].min + Math.floor(Math.random() * (zombieXs[areaXIdx].max - zombieXs[areaXIdx].min));
        let z = zombieZs[areaZIdx].min + Math.floor(Math.random() * zombieZs[areaZIdx].max - zombieZs[areaZIdx].min);

        return new THREE.Vector3(x, 0.5, z);
    }

    function getRandomSkin(){
        let random = Math.random();
        if(random < 0.5) return 'Zombie_Male';
        else return 'Zombie_Female'
    }


    for(zombieNo; zombieNo < 10; zombieNo < maxActiveZombies)
        addZombie(getRandomPosition(), zombieNo++, getRandomSkin());


    function moveForward(zombieObj){
        let vector = new THREE.Vector3( 0, 0, 1 );
        vector.applyQuaternion( zombieObj.quaternion );
        vector.divideScalar(30);
        zombieObj.position.add(vector);
    }

    function getPlayerPosition(){
        let vector = camera.position.clone();
        vector.applyMatrix4(camera.matrixWorld);
        return vector;
    }


    const ground = physics.add.ground({ name: 'ground', width: 200, height: 200 }, { lambert: { color: 0x504746 } })
    ground.receiveShadow = true;
    ground.castShadow = true;

    const wall1 = physics.add.box({ width: 200, height: 30, y: 15, z: 100, collisionFlags: 2}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    scene.add(wall1);

    const wall2 = physics.add.box({ width: 200, height: 30, y: 15, z: -100, collisionFlags: 2}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    scene.add(wall2);

    const wall3 = factory.add.box({ width: 200, height: 30, x: 100, y: 15}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    wall3.rotation.y = Math.PI/2;
    physics.add.existing(wall3);
    wall3.body.setCollisionFlags(2);

    const wall4 = factory.add.box({ width: 200, height: 30, x: -100, y: 15}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    wall4.rotation.y = Math.PI/2;
    physics.add.existing(wall4);
    wall4.body.setCollisionFlags(2);


    const clock = new THREE.Clock()

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );


    const emitter = new THREE.Object3D();
    emitter.position.set(2, -0.5, -5);
    camera.add(emitter);


    window.addEventListener("mousedown", onMouseDown);
    let bullets = [];

    const gunTranslation = new THREE.Vector3(0.95, -0.05, 0);
    let gunFocused = -1;

    const bulletGeometry = new THREE.SphereGeometry(0.04, 3, 3);
    const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0x9D8420 });

    function fireBullet(){

        let bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        bullet.name = 'bullet';

        bullet.position.copy(emitter.getWorldPosition());
        bullet.quaternion.copy(camera.quaternion);

        scene.add(bullet);
        physics.add.existing(bullet, {mass: 0.0001, collisionFlags: 0});

        bullet.body.applyForceX(-emitter.getWorldDirection().x * 0.008);
        bullet.body.applyForceY(-emitter.getWorldDirection().y * 0.008);
        bullet.body.applyForceZ(-emitter.getWorldDirection().z * 0.008);

        bullet.body.setCcdMotionThreshold(1);

        bullet.body.setCcdSweptSphereRadius(0.02);
        bullets.push({object: bullet, birthTime: Date.now()});

    }


    const bloodGeometries = [new THREE.SphereGeometry(0.1, 3, 3)];
    const bloodMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

    const bloodGeometriesLen = 5;
    for(let i = 1; i < bloodGeometriesLen; i++) bloodGeometries.push(new THREE.SphereGeometry(Math.random() * 0.3, 5, 5));

    function bleed(zombieObj){

        let bloodDrop = new THREE.Mesh(bloodGeometries[0], bloodMaterial);

        bloodDrop.name = 'blood';

        bloodDrop.position.copy(zombieObj.position);
        bloodDrop.position.y += 2;

        scene.add(bloodDrop);
        physics.add.existing(bloodDrop, {mass: 0.085, collisionFlags: 0});

        bloodDrop.body.applyForceX((Math.random() - 0.5) * 2);
        bloodDrop.body.applyForceZ((Math.random() - 0.5) * 2);

        blood.push({object: bloodDrop, birthTime: Date.now()});
    }

    let blood = [];


    function bloodFountain(zombiePos){
        for(let i = 0; i < 15; i++) {

            let bloodDrop = new THREE.Mesh(bloodGeometries[Math.floor(Math.random() * bloodGeometriesLen)], bloodMaterial);

            bloodDrop.name = 'blood';

            bloodDrop.position.copy(zombiePos);

            physics.add.existing(bloodDrop, {mass: 1 ,collisionFlags: 0});

            bloodDrop.body.applyForceX((Math.random() - 0.5) * 10);
            bloodDrop.body.applyForceY(Math.random() * 20);
            bloodDrop.body.applyForceZ((Math.random() - 0.5) * 10);

            scene.add(bloodDrop);

            blood.push({object: bloodDrop, birthTime: Date.now()});
        }
    }

    function bloodFlow(bloodDrop){
        bloodDrop.position.x += (Math.random() - 0.5) * 0.1;
        bloodDrop.position.y += Math.random() * 0.1;
        bloodDrop.position.z += (Math.random() - 0.5) * 0.1;
    }


    function gunFocus(){

        gun.position.x += gunFocused * gunTranslation.x;
        gun.position.y += gunFocused * gunTranslation.y;
        gun.position.z += gunFocused * gunTranslation.z;
        gun.rotation.y -= gunFocused *  0.05;

        emitter.position.x += 2 * gunFocused * gunTranslation.x;
        emitter.position.y += gunFocused * gunTranslation.y;
        emitter.position.z += gunFocused * gunTranslation.z;
        gunFocused *= -1;

    }

    function onMouseDown(event){
        if(event.button === 0){
            fireBullet();
        }
        else if(event.button === 2){
            gunFocus();
        }
    }

    function resetAnimationSpecifics() {
        newZombieSpawnTime = 10000;
        lastSpawnTime = Date.now();
        startTime = Date.now();
        extraTime = 0;
        activateAllZombies();
    }

    function stopAnimation() {
        animationPlaying = false;
    }

    function startAnimation(){
        animationPlaying = true;
        requestAnimationFrame(animate);
    }


    function activateAllZombies(){
        for(let element in inactiveZombies) activateOneZombie();
    }

    function activateOneZombie(){
        let newZombie, zombieName;
        for(zombieName in inactiveZombies){
            newZombie = inactiveZombies[zombieName];
            delete inactiveZombies[zombieName];
            break;
        }

        newZombie.health = zombieHealth;
        newZombie.object.visible = true;
        newZombie.active = true;
        newZombie.mixer.clipAction(newZombie.walkAnimation).play();
        zombies.push(newZombie);
    }



    const bulletAgeLimit = 500;
    const bloodAgeLimit = 1000;
    const zombieDieTime = 1000;

    let newZombieSpawnTime = 10000;
    let lastSpawnTime = Date.now();

    let startTime = Date.now();


    const animate = () => {

        if(!animationPlaying) return;

        let delta = clock.getDelta();

        let currentTime = Date.now();

        for (let i = bullets.length - 1; i >= 0; i--) {
            let bullet = bullets[i].object;
            if(bullet && bullet.geometry && bullet.material) {
                if (currentTime - bullets[i].birthTime > bulletAgeLimit) {
                    scene.remove(bullet);
                    physics.destroy(bullet.body);
                    bullets.splice(i, 1);
                }
                else bullet.body.needsUpdate = true;
            }
        }

        for (let i = blood.length - 1; i >= 0; i--) {
            let bloodDrop = blood[i].object;
            if(bloodDrop) {
                if (bloodDrop.geometry && bloodDrop.material) {
                    if (currentTime - blood[i].birthTime > bloodAgeLimit) {
                        scene.remove(bloodDrop);
                        physics.destroy(bloodDrop.body);
                        blood.splice(i, 1);
                    } else {
                        // bloodFlow(bloodDrop);
                        bloodDrop.body.needsUpdate = true;
                    }
                }
            }
        }


        for(let i = zombies.length; i>=0; i--) {
            let zombie = zombies[i];
            if(zombie && zombie.object) {

                if (zombie.mixer) zombie.mixer.update(delta * 2);

                if (zombie.active) {

                    moveForward(zombie.object);

                    if(player?.box?.position?.distanceTo(zombie.object.position) < 10 && !zombie.recentlyCollided) {
                        zombie.object.lookAt(new THREE.Vector3(player.box.position.x, zombie.object.position.y, player.box.position.z));
                        zombie.zombieCollided = player;
                    }

                    zombie.recentlyCollided = false;
                    zombie.object.body.needUpdate = true;
                    zombie.deathStart = currentTime;

                } else if(currentTime - zombie.deathStart < zombieDieTime) {

                    zombie.mixer.clipAction(zombie.dieAnimation).play();
                    extraTime += 200;
                    zombiesKilled++;

                } else {

                    zombie.mixer.stopAllAction();
                    bloodFountain(zombie.object.position);

                    zombie.object.visible = false;
                    zombie.active = false;
                    inactiveZombies[zombie.object.name] = zombie;

                    zombie.object.position.copy(getRandomPosition());
                    zombie.object.body.needUpdate = true;

                    zombies.splice(i, 1);
                }

            }
        }

        // physics.updateDebugger();

        camera.updateMatrixWorld();

        let cameraPosition = getPlayerPosition();

        let playerBox = player.box;

        playerBox.position.x = cameraPosition.x;
        playerBox.position.y = cameraPosition.y + 3;
        playerBox.position.z = cameraPosition.z;
        playerBox.body.needUpdate = true;

        if(currentTime - lastSpawnTime > newZombieSpawnTime){
            lastSpawnTime = currentTime;
            if(newZombieSpawnTime > 5000) newZombieSpawnTime -= 100;

            if(Object.keys(inactiveZombies).length !== 0) activateOneZombie();

        }

        renderer.render(scene, camera);

        physics.update(clock.getDelta() * 1000000000);

        requestAnimationFrame(animate);

        controls.update( Date.now() - time );

        // renderer.render(scene, camera);

        time = Date.now();

        let timeLeftPercent = 100 - 100 * (time - extraTime - startTime)/maxGameTime;
        if(timeLeftPercent - 0.001 < 0) stopAnimation();

        document.getElementById("timeBar").style.width = timeLeftPercent + '%';

        //  TODO: screens
        //  TODO: bloodFountain improvements

    }
}
PhysicsLoader('./lib', () => MainScene())
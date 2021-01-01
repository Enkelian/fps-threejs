
const { AmmoPhysics, PhysicsLoader } = ENABLE3D

let controls, time = Date.now();

const MainScene = () => {


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
    physics.debug.enable(true)


    const { factory } = physics


    function createGun(){
        const pistol = new THREE.FBXLoader();
        pistol.load( './guns/FBX/Pistol.fbx', object => {

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

        } );
    }

    createGun();

    const player = { box: null, health: 100}

    function setCharacterBox(){
        let boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        let boxMaterial = new THREE.MeshPhongMaterial({transparent: true, opacity: 0.1, color: 0x000000});
        let box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.name = 'player';
        box.position.y += 1.5;
        scene.add(box);
        physics.add.existing(box);

        box.body.setCollisionFlags(2);


        box.body.on.collision((otherObject, event) => {
            if(otherObject.name !== 'ground'){
                // controls.isOnObject(true);
                // console.log('is on object')
            }
            if (otherObject.name.startsWith('zombie')) {
                player.health--;
                console.log('Player collided with zombie. Remaining health: ' + player.health)
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
                { shape: 'box', width: 10, height: 8, depth: 10, mass: 10000000000, y: object.position.y + 3.5 }
            ]
            physics.add.existing(object, {compound});
            object.body.setCollisionFlags(2);

            scene.add( object );

        } );
    }

    addBuilding({x: 0, y: 0, z: -10}, '1Story_Mat');
    addBuilding({x: 20, y: 0, z: -10}, '2Story_Mat');
    addBuilding({x: 40, y: 0, z: 40}, '2Story_Sign_Mat', Math.PI);
    addBuilding({x: 20, y: 0, z: 40}, '1Story_Sign_Mat', Math.PI);
    addBuilding({x: 0, y: 0, z: 40}, '1Story_Sign_Mat', Math.PI);
    addBuilding({x: 0, y: 0, z: 80}, '1Story_Sign_Mat', Math.PI);
    addBuilding({x: 20, y: 0, z: 80}, '3Story_Small_Mat', Math.PI);
    addBuilding({x: 40, y: 0, z: 80}, '4Story_Mat', Math.PI);

    let zombieNo = 0;
    let zombies = [];
    let inactiveZombies = [];
    let maxActiveZombies = 3;

    const zombieLoader = new THREE.FBXLoader();

    function addZombie(position, zombieNo, fileName) {

        const zombie = {
            object: null,
            mixer: null,
            zombieCollided: null,
            recentlyCollided: false,
            health: 4,
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
                        if (zombie.zombieCollided !== otherObject && !zombie.recentlyCollided) {
                            let randomRotation = Math.random() * Math.PI + Math.PI / 2;
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
                    inactiveZombies.push(zombie);
                    zombie.object.visible = false;
                    zombie.active = false;
                }


            });
        }

    }


    addZombie(new THREE.Vector3(0, 0.5, 10), zombieNo++, 'Zombie_Male');
    addZombie(new THREE.Vector3(0, 0.5, 15), zombieNo++, 'Zombie_Male');
    addZombie(new THREE.Vector3(10, 0.5, 10), zombieNo++, 'Zombie_Female');
    addZombie(new THREE.Vector3(15, 0.5, 10), zombieNo++, 'Zombie_Female');
    addZombie(new THREE.Vector3(15, 0.5, 10), zombieNo++, 'Zombie_Male');

    function deleteZombie(zombieObj){
        let zombieMesh = zombieObj.children[0];
        zombieMesh.geometry.dispose();
        zombieMesh.material.forEach(material => material.dispose());
        zombieMesh.skeleton.dispose();
        scene.remove(zombieObj);
        physics.destroy(zombieObj.body);
    }

    function moveForward(zombieObj){
        let vector = new THREE.Vector3( 0, 0, 1 );
        vector.applyQuaternion( zombieObj.quaternion );
        vector.divideScalar(50);
        zombieObj.position.add(vector);
    }

    function getPlayerPosition(){
        let vector = camera.position.clone();
        vector.applyMatrix4(camera.matrixWorld);
        return vector;
    }


    const ground = physics.add.ground({ name: 'ground', width: 300, height: 200 }, { lambert: { color: 0x504746 } })
    ground.receiveShadow = true;
    ground.castShadow = true;

    const wall1 = physics.add.box({ width: 300, height: 30, y: 15, z: 100, collisionFlags: 2}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    scene.add(wall1);

    const wall2 = physics.add.box({ width: 300, height: 30, y: 15, z: -100, collisionFlags: 2}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    scene.add(wall2);

    const wall3 = factory.add.box({ width: 200, height: 30, x: 149, y: 15}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    wall3.collisionFlags = 2;
    wall3.rotation.y = Math.PI/2;
    physics.add.existing(wall3);

    const wall4 = factory.add.box({ width: 200, height: 30, x: -149, y: 15}, { lambert: { color: 'hotpink', transparent: true, opacity: 0 } });
    wall4.collisionFlags = 2;
    wall4.rotation.y = Math.PI/2;
    physics.add.existing(wall4);


    const clock = new THREE.Clock()

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );


    const emitter = new THREE.Object3D();
    emitter.position.set(2, -0.5, -5);
    camera.add(emitter);


    window.addEventListener("mousedown", onMouseDown);
    let bullets = [];

    const gunTranslation = new THREE.Vector3(0.7, 0, 0);
    let gunFocused = -1;

    function fireBullet(){
        let geometry = new THREE.SphereGeometry(0.01, 3, 3);
        let material = new THREE.MeshLambertMaterial({ color: 0x9D8420 });
        let bullet = new THREE.Mesh(geometry, material);

        bullet.name = 'bullet';

        bullet.position.copy(emitter.getWorldPosition());
        bullet.quaternion.copy(camera.quaternion);

        scene.add(bullet);
        physics.add.existing(bullet, {mass: 0.0001, collisionFlags: 0});

        bullet.body.applyForceX(-emitter.getWorldDirection().x * 0.008);
        bullet.body.applyForceY(-emitter.getWorldDirection().y * 0.008);
        bullet.body.applyForceZ(-emitter.getWorldDirection().z * 0.008);

        bullet.body.setCcdMotionThreshold(1);

        bullet.body.setCcdSweptSphereRadius(0.01);
        bullets.push({object: bullet, age: Date.now()});

    }


    function bleed(zombieObj){
        let geometry = new THREE.SphereGeometry(0.1, 3, 3);
        let material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        let bloodDrop = new THREE.Mesh(geometry, material);

        bloodDrop.name = 'blood';

        bloodDrop.position.copy(zombieObj.position);
        bloodDrop.position.y += 2;

        scene.add(bloodDrop);
        physics.add.existing(bloodDrop, {mass: 0.1, collisionFlags: 0});

        bloodDrop.body.applyForceX((Math.random() - 0.5) * 2);
        // bloodDrop.body.applyForceY((Math.random() * 10);
        bloodDrop.body.applyForceZ((Math.random() - 0.5) * 2);

        blood.push({object: bloodDrop, age: Date.now()});
    }

    let blood = [];


    function bloodFountain(zombiePos){
        for(let i = 0; i < 20; i++) {
            let geometry = new THREE.SphereGeometry(Math.random() * 0.3, 5, 5);
            let material = new THREE.MeshLambertMaterial({color: 0xff0000});
            let bloodDrop = new THREE.Mesh(geometry, material);

            bloodDrop.name = 'blood';

            bloodDrop.position.copy(zombiePos);

            physics.add.existing(bloodDrop, {mass: 1,collisionFlags: 0});

            bloodDrop.body.applyForceX((Math.random() - 0.5) * 10);
            bloodDrop.body.applyForceY(Math.random() * 20);
            bloodDrop.body.applyForceZ((Math.random() - 0.5) * 10);

            scene.add(bloodDrop);

            blood.push({object: bloodDrop, age: Date.now()});
        }
    }

    function bloodFlow(bloodDrop){
        bloodDrop.position.x += Math.random();
        bloodDrop.position.y += Math.random();
        bloodDrop.position.z += Math.random();
    }


    function gunFocus(){

        let gun = camera.getObjectByName('gun');
        if(!gun) return;

        gun.position.x += gunFocused * gunTranslation.x;
        gun.position.y += gunFocused * gunTranslation.y;
        gun.position.z += gunFocused * gunTranslation.z;

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

    function getRandomPosition(){
        return new THREE.Vector3(Math.random(), 0.5, Math.random());
    }

    const bulletAgeLimit = 500;
    const bloodAgeLimit = 1000;
    const zombieDieTime = 1000;

    let newZombieSpawnTime = 10000;
    let lastSpawnTime = Date.now();


    const animate = () => {

        let delta = clock.getDelta();

        let currentTime = Date.now();

        for (let i = bullets.length - 1; i >= 0; i--) {
            let bullet = bullets[i].object;
            let bulletAge = bullets[i].age;
            if(bullet && bullet.geometry && bullet.material) {
                if (currentTime - bulletAge > bulletAgeLimit) {
                    bullet.geometry.dispose();
                    bullet.material.dispose();
                    scene.remove(bullet);
                    physics.destroy(bullet.body);
                    bullets.splice(i, 1);
                }
            }
            else{
                bullets[i].age = currentTime;
                bullet.body.needsUpdate = true;
            }
        }

        for (let i = blood.length - 1; i >= 0; i--) {
            let bloodDrop = blood[i].object;
            let age = blood[i].age;
            if(bloodDrop) {
                if (bloodDrop.geometry && bloodDrop.material) {
                    if (currentTime - age > bloodAgeLimit) {
                        bloodDrop.geometry.dispose();
                        bloodDrop.material.dispose();
                        scene.remove(bloodDrop);
                        physics.destroy(bloodDrop.body);
                        blood.splice(i, 1);
                    }
                } else {
                    blood[i].age = currentTime;
                    bloodFlow(bloodDrop);
                    bloodDrop.body.needsUpdate = true;
                }
            }
        }


        for(let i = zombies.length; i>=0; i--) {
            let zombie = zombies[i];
            if(zombie && zombie.object) {
                if (zombie.mixer) zombie.mixer.update(delta * 2);
                if (zombie.active) {

                    moveForward(zombie.object);

                    if(player && player.box && player.box.position.distanceTo(zombie.object.position) < 10 && !zombie.recentlyCollided){
                        zombie.object.lookAt(new THREE.Vector3(player.box.position.x, zombie.object.position.y, player.box.position.z));
                    }

                    zombie.recentlyCollided = false;
                    zombie.object.body.needUpdate = true;
                    zombie.deathStart = currentTime;

                } else if(currentTime - zombie.deathStart < zombieDieTime) {
                    zombie.mixer.clipAction(zombie.dieAnimation).play();
                } else {
                    zombie.object.visible = false;
                    zombie.active = false;
                    inactiveZombies.push(zombie);
                    zombie.mixer.stopAllAction();
                    bloodFountain(zombie.object.position);
                    // deleteZombie(zombie.object);
                    zombies.splice(i, 1);
                }

            }
        }

        physics.updateDebugger();

        camera.updateMatrixWorld();

        let cameraPosition = getPlayerPosition();

        let playerBox = player.box;

        playerBox.position.x = cameraPosition.x;
        playerBox.position.y = cameraPosition.y + 3;
        playerBox.position.z = cameraPosition.z;
        playerBox.body.needUpdate = true;

        if(currentTime - lastSpawnTime > newZombieSpawnTime){
            console.log('new spawn')
            lastSpawnTime = currentTime;
            if(newZombieSpawnTime > 5000) newZombieSpawnTime -= 100;

            if(inactiveZombies?.length) {
                let newZombie = inactiveZombies.pop();
                zombies.push(newZombie);
                newZombie.health = 2;
                newZombie.object.visible = true;
                newZombie.active = true;
                // TODO: set position to random
                newZombie.mixer.clipAction(newZombie.walkAnimation).play();
                // newZombie.mixer.actions
                console.log(newZombie.mixer.stats);

            }

            // addZombie(getRandomPosition(), zombieNo++, 'Zombie_Female');

        }


        renderer.render(scene, camera);

        physics.update(clock.getDelta() * 1000000000)


        requestAnimationFrame(animate);

        controls.update( Date.now() - time );

        renderer.render( scene, camera );

        time = Date.now();
        // controls.isOnObject(false);

        //  TODO: health bar
        //  TODO: replace recentlyCollided with timeFromCollision
        //  TODO: limited time for zombie elimination
    //    TODO: loading screen, defeat screen, victory screen
        //TODO: one animation mixer for zombies?

    }
    requestAnimationFrame(animate)
}
PhysicsLoader('./lib', () => MainScene())
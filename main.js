
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

    const pistol = new THREE.FBXLoader();
    pistol.load( './guns/FBX/Pistol.fbx', object => {
        object.name = 'gun';
        object.scale.setScalar(0.001);
        object.position.x += 1;
        object.position.y -= 0.5;
        object.position.z -= 2;
        object.rotation.y += 1.5;
        // object.rotation.x -= 0.1;
        object.traverse( function ( child ) {
            // if ( child.isMesh ) {
            //   child.material.wireframe bullet= true;
            // }

            if( child.material ) {
                child.material = new THREE.MeshPhongMaterial({
                    color: 0x2E282A,
                    emissive: true,
                    emissiveIntensity: 0.5
                });
            }

        } );


        camera.add( object );
        // physics.add.existing(object);

    } );
    let playerHealth = 100;

    function setCharacterBox(){
        let boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        let boxMaterial = new THREE.MeshPhongMaterial({transparent: true, opacity: 0.1, color: 0x000000});
        let box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.name = 'player';
        // box.position.z -= 3;
        // box.position.y ;
        scene.add(box);
        physics.add.existing(box);

        // camera.add(box.body)
        box.body.setCollisionFlags(2);

        box.body.on.collision((otherObject, event) => {
            if (otherObject.name.startsWith('zombie')) {
                playerHealth--;
                console.log('Player collided with zombie. Remaining health: ' + playerHealth)

            }
        });          // let box = factory.add.box({x:0, y:0, z:0, width: 0.5, height: 2, depth: 0.5});
        // physics.add(box);
        // camera.add(box);
        // box.add(camera);
        return box;
    }

    const player = setCharacterBox();

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
            // object.geometry.translationY += 5;
            buildings.push(object);

            const compound = [
                { shape: 'box', width: 10, height: 8, depth: 10, mass: 10000000000, y: object.position.y + 3.5 }
            ]
            physics.add.existing(object, {compound});
            object.body.setCollisionFlags(2);

            scene.add( object );

        } );
    }

    addBuilding({x: 0, y: 0, z: 0}, '1Story_Mat');
    addBuilding({x: 20, y: 0, z: 0}, '2Story_Mat');
    addBuilding({x: 40, y: 0, z: 40}, '2Story_Sign_Mat', Math.PI);
    addBuilding({x: 20, y: 0, z: 40}, '1Story_Sign_Mat', Math.PI);
    addBuilding({x: 0, y: 0, z: 40}, '1Story_Sign_Mat', Math.PI);



    let zombieNo = 0;
    let zombies = [];

    function addZombie(position, zombieNo) {
        const zombieLoader = new THREE.FBXLoader();

        const zombie = { object: null, mixer: null, zombieCollided: null, recentlyCollided: false};

        zombieLoader.load( './enemies/FBX/Zombie_Female.fbx', object => {

            object.name = 'zombie' + zombieNo;

            let mixer = new THREE.AnimationMixer(object);
            let action = mixer.clipAction(object.animations[8]);
            action.play();

            object.scale.setScalar(0.01);

            object.position.x = position.x
            object.position.y = position.y;
            object.position.z = position.z;
            object.rotation.y = Math.PI;


            const compound = [
                { shape: 'sphere', radius: 0.65, y: 2.5,  mass: 1},
                { shape: 'box', width: 1, height: 3, y: 1.5, depth: 0.4, mass: 1}
            ]

            physics.add.existing(object, { compound });
            object.body.setCollisionFlags(6);

            object.body.on.collision((otherObject, event) => {
                if (otherObject.name === 'bullet'){
                    console.log('zombie hit!')
                }
                else if (otherObject.name !== 'ground') {
                    if(zombie.zombieCollided !== otherObject && !zombie.recentlyCollided) {
                        let randomRotation = Math.random() * Math.PI + Math.PI/2;
                        object.rotation.y += randomRotation;
                        zombie.zombieCollided = otherObject;
                        zombie.recentlyCollided = true;
                    }
                }
            });
            zombie.object = object;
            zombie.mixer = mixer;
            zombies.push(zombie);
            scene.add( object );

        } );
    }

    addZombie({x: 0, y: 0.5, z: 10}, zombieNo++);
    addZombie({x: 0, y: 0.5, z: 15}, zombieNo++);
    addZombie({x: 10, y: 0.5, z: 10}, zombieNo++);

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

    function changeDirectionToPlayer(zombieObj){
        // let playerPosition = getPlayerPosition();
        // zombieObj.rotation.y = Math.atan2(playerPosition.z, playerPosition.x);
    }


    const ground = physics.add.ground({ name: 'ground', width: 200, height: 200 }, { lambert: { color: 0x504746 } })
    ground.receiveShadow = true;
    ground.castShadow = true;

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
        let geometry = new THREE.SphereGeometry(0.1, 16, 16);
        let material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        let bullet = new THREE.Mesh(geometry, material);

        bullet.name = 'bullet';

        bullet.position.copy(emitter.getWorldPosition());
        bullet.quaternion.copy(camera.quaternion);

        scene.add(bullet);
        physics.add.existing(bullet, {mass: 0.00001, collisionFlags: 0});

        bullet.body.applyForceX(-emitter.getWorldDirection().x * 0.001);
        bullet.body.applyForceY(-emitter.getWorldDirection().y * 0.001);
        bullet.body.applyForceZ(-emitter.getWorldDirection().z * 0.001);

        bullet.body.setCcdMotionThreshold(1);

// Set the radius of the embedded sphere such that it is smaller than the object
        bullet.body.setCcdSweptSphereRadius(0.1);
        bullets.push({object: bullet, age: Date.now()});

    }


    function gunFocus(){
        let gun = camera.getObjectByName('gun');
        if(!gun) return;
        gun.position.x += gunFocused * gunTranslation.x;
        gun.position.y += gunFocused * gunTranslation.y;
        gun.position.z += gunFocused * gunTranslation.z;
        emitter.position.x += gunFocused * 2 * gunTranslation.x;
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

    const ageLimit = 500;
    const animate = () => {

        let delta = clock.getDelta();

        let currentTime = Date.now();

        for (let i = bullets.length - 1; i >= 0; i--) {
            let bullet = bullets[i].object;
            let bulletAge = bullets[i].age;
            if(bullet && bullet.geometry && bullet.material) {
                if (currentTime - bulletAge > ageLimit) {
                    bullet.geometry.dispose();
                    bullet.material.dispose();
                    scene.remove(bullet);
                    physics.destroy(bullet.body);
                    bullets.splice(i, 1);
                }
            }
            else bullets[i].age = currentTime;
        }

        zombies.forEach((zombie) => {
            if(zombie.mixer) zombie.mixer.update(delta)

            if(zombie.object) {

                moveForward(zombie.object);

                if(!zombie.recentlyCollided){
                    changeDirectionToPlayer(zombie.object);
                }
                zombie.recentlyCollided = false;
                zombie.object.body.needUpdate = true;
            }

        });


        physics.updateDebugger();


        camera.updateMatrixWorld();

        let cameraPosition = getPlayerPosition();

        player.position.x = cameraPosition.x;
        player.position.y = cameraPosition.y + 3;
        player.position.z = cameraPosition.z;
        player.body.needUpdate = true;


        renderer.render(scene, camera);

        physics.update(clock.getDelta() * 1000000000)


        requestAnimationFrame(animate);

        controls.update( Date.now() - time );

        renderer.render( scene, camera );

        time = Date.now();


        //  TODO: health bar
        //  TODO: work on bullet collision
        // TODO: zombie movement: a random number of zombies will change their direction to player's position

    }
    requestAnimationFrame(animate)
}
PhysicsLoader('./lib', () => MainScene())
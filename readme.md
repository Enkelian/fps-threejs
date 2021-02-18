# Zombie Siege

## Basic information
A simple FPS game. The objective is to kill as many zombies as possible in the limited time.
Remaining time increases with every kill and decreases whenever a player comes into contact with an enemy.

## Used libraries

* ThreeJS
* enable3d - a physics engine
* PointerLockControls

## Used resources

* LowPoly Models by Quaternius
* Free Skybox Textures by Kindaw

## Code structure

First, Pointer Lock Controls are set up, as well as loading and end screens. 

Then, the standard ThreeJS scene and camera setup takes place.

Crucial functions:
* `createGun`
* `setCharacterBox`
* `createZombie`
* `createBuilding`
* `moveForward`
* `fireBullet`
* `bleed`
* `bloodFountain`
* `gunFocus`
* `animate`

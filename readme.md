# Zombie Siege

## Basic information

A simple FPS game. The objective is to kill as many zombies as possible in the limited time.
Remaining time increases with every kill and decreases whenever a player comes into contact with an enemy.

The enemies move in a fixed direction until they collide with an object (or end of map). 
Also, whenever the player comes close enough, a zombie will change their direction and move towards the player.

If a zombie dies, a defeat animation is played, and the zombie is added to a queue of inactive enemies. After some time,
the zombie will be respawned at a randomly chosen location. 

## Running

Project can be run through IntelliJ IDE or using npx [npx](https://www.npmjs.com/package/npx).
After installing npx, simply run `npx http-server .` in project root and enter the first link.

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
* `createGun` - sets up the player's gun
* `setCharacterBox` - sets up a collision box for the character
* `createZombie` - loads a zombie and creates a corresponding enable3d body 
* `createBuilding` - loads a building and creates a corresponding enable3d body
* `moveForward` - moves a zombie forward
* `fireBullet` - creates and fires a bullet from a player's gun (a bullet is a sphere)
* `bleed` - causes zombie to "bleed" - creates a red sphere that launches from a hit zombie
* `bloodFountain` - red balls of random size launched into the air upon zombie's death
* `gunFocus` - turns on or off the gun focus - moves the gun mesh
* `animate` -
  * obsolete bullets and blood drops are deleted
  * zombies are made to move forward
  * if a zombie's health reached 0, a different animation is played and eventually, the zombie is deleted
  * if possible, new zombies are spawned
  * physics is updated

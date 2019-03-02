const Direction = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39
}
const NPC = true
const ShootCode = 32
const Size = {
  tank: { width: 30, height: 30 },
  bullet: { width: 16, height: 16 },
  stage: { width: 500, height: 500 }
}
const Type = {
  RED: 'red',
  BLUE: 'blue'
}
const STEP = 5
class Util {
  constructor() { }
  addBullet(game, buttet) {
    game.addBullet(buttet)
  }

  getReverse(dir) {
    switch (dir) {
      case Direction.UP:
        return Direction.DOWN
      case Direction.DOWN:
        return Direction.UP
      case Direction.LEFT:
        return Direction.RIGHT
      case Direction.RIGHT:
        return Direction.LEFT
    }
  }

  addTank(game, tank) {
    game.addTank(tank)
  }

  addClass($e, className) {
    const cls = $e.getAttribute('class')
    $e.setAttribute('class', cls + ' ' + className)
  }
  removeClass($e, className) {
    const cls = $e.getAttribute('class')
    $e.setAttribute('class', cls.split(' ').filter(value => value !== className).join(' '))
  }

  changePosition($e, dir, step = STEP) {
    const { x, y } = this.getInfo($e)
    switch (dir) {
      case Direction.UP:
        $e.style.top = y - STEP + 'px'
        break
      case Direction.DOWN:
        $e.style.top = y + STEP + 'px'
        break
      case Direction.LEFT:
        $e.style.left = x - STEP + 'px'
        break
      case Direction.RIGHT:
        $e.style.left = x + STEP + 'px'
        break
    }
  }
  getInfo($e) {
    let rect = $e.getClientRects()
    let width = 10
    let height = 10
    if (rect && rect[0]) {
      rect = rect[0]
      width = rect.width
      height = rect.height
    }
    let x = parseFloat($e.style.left)
    let y = parseFloat($e.style.top)
    if (!x || !y) {
      x = rect.x
      y = rect.y
    }

    return { x, y, width, height }
  }
  isIn($inside, $over) {
    const infoIn = this.getInfo($inside)
    const infoOver = this.getInfo($over)
    const { x, y, width, height } = infoIn
    if (x > 0 && y > 0 && x + width < infoOver.width && y + height < infoOver.height) {
      return true
    } else {
      return false
    }
  }

  isWarn($inside, $over) {
    const infoIn = this.getInfo($inside)
    const infoOver = this.getInfo($over)
    const { x, y, width, height } = infoIn
    if (x > 5 && y > 5 && x + width < infoOver.width - 5 && y + height < infoOver.height - 5) {
      return false
    } else {
      return true
    }
  }

  isOverlap($a, $b) {
    let overlap = false
    const infoA = this.getInfo($a)
    const infoB = this.getInfo($b)
    const infoA_point = {
      a: [infoA.x, infoA.y],
      b: [infoA.x + infoA.width, infoA.y],
      c: [infoA.x + infoA.width, infoA.y + infoA.height],
      d: [infoA.x, infoA.y + infoA.height],
    }
    const points = [[infoB.x, infoB.y],
    [infoB.x + infoB.width, infoB.y],
    [infoB.x + infoB.width, infoB.y + infoB.height],
    [infoB.x, infoB.y + infoB.height]]
    points.forEach((point) => {
      if (this._isIn(infoA_point, point)) {
        overlap = true
      }
    })

    return overlap
  }
  _isIn(area, point) {
    if (
      point[0] > area.a[0]
      && point[0] < area.b[0]
      && point[1] > area.a[1]
      && point[1] < area.d[1]
    ) {
      return true
    } else {
      return false
    }
  }
}

class Bullet {
  constructor(position, type, direction) {
    const { x, y } = position
    this.type = type
    this.alive = true
    this.$killTank = null
    this.direction = direction
    this.$stage = document.querySelector('#stage')
    this.$e = document.createElement('div')
    this.$e.setAttribute('class', `bullet buttet-${type} dir-${this.direction}`)
    this.$e.style.left = x + 'px'
    this.$e.style.top = y + 'px'
    this.$stage.appendChild(this.$e)
    this.move()
  }

  move() {
    util.changePosition(this.$e, this.direction)
    if (this.isAlive() && this.alive) {
      setTimeout(() => {
        this.move()
      }, 10)
    } else {
      if (this.$killTank) {
        this.$stage.removeChild(this.$killTank)
      }
      this.$stage.removeChild(this.$e)
    }
  }

  isIn() {
    return util.isIn(this.$e, this.$stage)
  }

  isKillTank() {
    let isKill = false
    const $tanks = document.querySelectorAll('.tank')
    Array.prototype.slice.call($tanks).forEach(($tank) => {
      if (util.isOverlap($tank, this.$e) && !$tank.getAttribute('class').includes(this.type)) {
        isKill = true
        this.$killTank = $tank
      }
    })

    return isKill
  }

  isAlive() {
    const alive = this.isIn() && !this.isKillTank()
    if (alive) {
      return true
    } else {
      this.alive = false
      return false
    }
  }
}
class Tank {
  constructor(position, type, number, dir, npc) {
    const { x, y } = position
    this.number = number
    this.speed = 0
    this.direction = dir
    this.alive = true
    this.type = type
    this.$stage = document.querySelector('#stage')
    this.$e = document.createElement('div')
    this.$e.setAttribute('class', `tank tank-${type} tank-${number} dir-${this.direction}`)
    this.$e.style.left = x + 'px'
    this.$e.style.top = y + 'px'
    this.$stage.appendChild(this.$e)
    this.shoot = this.shoot.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleClick = this.handleClick.bind(this)
    if (npc) {
      this.auto()
    } else {
      window.addEventListener('keydown', this.handleKeyDown)
      window.addEventListener('click', this.handleClick)
    }
  }

  auto() {
    if (!document.querySelector('.tank-' + this.number)) {
      return
    }
    const random = Math.random() * 10
    const random2 = Math.floor(Math.random() * 4)
    if (random <= 0.3) {
      this.shoot()
    } else if (random > 0.5 && random <= 1) {
      this.turn(Direction[Object.keys(Direction)[random2]])
    } else {
      if (this.isWarn()) {
        this.turn(util.getReverse(this.direction))
        this.move(1)
      } else {
        this.move(1)
      }
    }
    setTimeout(() => {
      this.auto()
    }, 100)
  }

  handleClick(e) {
    if (document.querySelector('.tank-' + this.number)) {
      this.shoot()
    } else {
      window.removeEventListener('keydown', this.handleKeyDown)
      window.removeEventListener('click', this.handleClick)
    }
  }

  handleKeyDown(e) {
    if (document.querySelector('.tank-' + this.number)) {
      const keyCode = e.keyCode
      const directions = Object.keys(Direction).map(key => Direction[key])
      if (directions.includes(keyCode)) {
        this.turn(keyCode)
        this.move()
      }
    } else {
      window.removeEventListener('keydown', this.handleKeyDown)
      window.removeEventListener('click', this.handleClick)
    }
  }

  move(step = STEP) {
    util.changePosition(this.$e, this.direction, step)
  }

  turn(dir) {
    this.direction = dir
    const tankClass = this.$e.getAttribute('class')
    this.$e.setAttribute('class', tankClass.replace(/dir-\d+/, 'dir-' + this.direction))
  }

  shoot() {
    const { x, y } = util.getInfo(this.$e)
    let bulletPositon = null
    switch (this.direction) {
      case Direction.DOWN:
        bulletPositon = {
          x: x + Size.tank.width / 2 - Size.bullet.width / 2,
          y: y + Size.tank.height + 4
        }
        break
      case Direction.UP:
        bulletPositon = {
          x: x + Size.tank.width / 2 - Size.bullet.width / 2,
          y: y - 4 - Size.bullet.height
        }
        break
      case Direction.RIGHT:
        bulletPositon = {
          x: x + Size.tank.width + 4,
          y: y + Size.tank.height / 2 - Size.bullet.height / 2
        }
        break
      case Direction.LEFT:
        bulletPositon = {
          x: x - 4 - Size.bullet.width,
          y: y + Size.tank.height / 2 - Size.bullet.height / 2
        }
        break
    }
    const bullet = new Bullet(bulletPositon, this.type, this.direction)
    util.addBullet(game, bullet)
  }

  isAlive() {
    if (document.querySelector('tank-' + this.number)) {
      return true
    } else {
      this.alive = false
      return false
    }
  }

  isIn() {
    return util.isIn(this.$e, this.$stage)
  }

  isWarn() {
    return util.isWarn(this.$e, this.$stage)
  }
}
const util = new Util()
class Game {
  constructor() {
    this.tanks = [
      new Tank({ x: 230, y: 230 }, Type.RED, 0, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 1, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 2, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 3, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 4, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 5, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 6, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 7, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 8, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 9, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 10, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 11, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 12, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 13, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 14, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 15, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 16, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 17, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 18, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 19, Direction.DOWN, NPC),
      new Tank({ x: 230, y: 230 }, Type.RED, 20, Direction.DOWN, NPC),
    ]
    this.bullets = []
    this.collect()
  }
  addBullet(bullet) {
    this.bullets.push(bullet)
  }
  addTank(tank) {
    this.tanks.push(tank)
  }
  collect() {
    let hasTanks = false
    if (this.tanks.length > 0) {
      hasTanks = true
      this._collect(this.tanks)
    }
    let hasBullets = false
    if (this.bullets.length > 0) {
      hasBullets = true
      this._collect(this.bullets)
    }
    if (hasTanks || hasBullets) {
      setTimeout(() => {
        this.collect()
      }, 10)
    } else {
      alert('Game over')
    }
  }
  _collect(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      if (!array[i].alive) {
        array.splice(i, 1)
      }
    }
  }

}
const game = new Game()



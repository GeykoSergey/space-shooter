class Player {
  constructor(game) {
    this.game = game;
    this.width = 100;
    this.height = 100;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height - this.height;
    this.speed = 10;
  }
  draw(context) {
    context.fillRect(this.x, this.y, this.width, this.height);
  }
  update() {
    // this.x += this.speed;
    if (this.game.keys.indexOf('ArrowLeft') > -1) this.x -= this.speed;

    if (this.game.keys.indexOf('ArrowRight') > -1) this.x += this.speed;
    if (this.x < -this.width * 0.5) this.x = -this.width * 0.5;
    else if (this.x > this.game.width - this.width * 0.5)
      this.x = this.game.width - this.width * 0.5;
  }
  shoot() {
    const projectile = this.game.getProjectile();
    if (projectile) projectile.start(this.x + this.width * 0.5, this.y);
  }
}
class Projectile {
  constructor() {
    this.width = 10;
    this.height = 20;
    this.x = 0;
    this.y = 0;
    this.speed = 20;
    this.free = true;
  }

  draw(context) {
    if (!this.free) {
      context.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  update() {
    if (!this.free) {
      this.y -= this.speed;
      if (this.y < -this.height) this.reset();
    }
  }
  start(x, y) {
    this.x = x - this.width * 0.5;
    this.y = y;
    this.free = false;
  }

  reset() {
    this.free = true;
  }
}

// **************************************************************
// Enemy
// **************************************************************
// Давайте создадим врагов, которые нападут на нас в большом строю.
// И каждый раз, когда мы побеждаем одну волну, придет большая волна врагов.
// Возьмите фоновое изображение PNG, которое вы найдете там, и поместите его в папку своего проекта.
// Затем используйте его как фоновое свойство.
// На самом деле мы можем сделать эту часть с помощью CSS.
// CSS ускоряется с помощью графического процессора, поэтому этот способ более производительный, чем перерисовка того же изображения.

// Я создам отдельных врагов, используя наш собственный класс врагов.
// Им понадобится доступ к некоторым методам и свойствам, которые я поместил в основной класс игры,
// поэтому у нас будет отсюда же ссылка на игровой класс - game.
// Здесь нам предстоит решить несколько задач, поскольку мы хотим, чтобы враги двигались по сетке, и мы хотим
// им двигаться в одном направлении.
// Я хочу, чтобы вся волна врагов следовала одному и тому же шаблону движения.
// Каждый враг, фактически как и  все объекты в нашей игре должны иметь ширину, высоту, а также свойства X и Y для целей обнаружения столкновений.
// Пользовательский метод рисования будет принимать контекст в качестве аргумента, и мы обведем прямоугольник, представляющий каждого врага.
// Я собирался также превратить врагов в пул объектов многократного использования, но я хочу, чтобы этот класс оставался для новичков.
// дружественный и объединяющий пул объектов с сеткой.

// На данный момент функция обновления пула объектов отсутствует, метод будет перемещать врага.
// Но если я хочу, чтобы все враги двигались в сетке по одной и той же схеме движения, мы не можем иметь индивидуальных
// скорость здесь и обновляйте каждого врага отдельно.
// Значение позиции всей волны врагов должно будет храниться где-то в одном месте нашего кода.
// и каждый враг будет знать, где он находится по отношению к этому значению.
// По мере движения волны все враги будут двигаться вместе с ней.

class Enemy {
  constructor(game, positionX, positionY) {
    this.game = game;
    this.width = this.game.enemySize;
    this.height = this.game.enemySize;
    this.x = 0;
    this.y = 0;
    // Таким образом, positionX и positionY — это позиция противника внутри волны.
    // Каждый враг должен точно знать, где он находится внутри сетки.
    this.positionX = positionX;
    this.positionY = positionY;
    this.markedForDeletions = false;
  }

  draw(context) {
    context.strokeRect(this.x, this.y, this.width, this.height);
    console.log(context);
  }

  update(x, y) {
    // X-позиция противника равна x-позиции волны плюс относительное горизонтальное положение противника в эта волна.
    this.x = x + this.positionX;
    // Положение Y противника будет равно вертикальному положению Y волны плюс относительное вертикальное положение этой конкретный враг в волне.
    this.y = y + this.positionY;

    this.game.projectilesPool.forEach((projectile) => {
      if (!projectile.free && this.game.checkCollision(this, projectile)) {
        this.markedForDeletions = true;
        projectile.reset();
      }
    });
  }
}

// **************************************************************
// Wave
// **************************************************************
// Мы создадим класс-оболочку под названием Wave.
// Опять же, нам понадобится доступ к свойствам и методам основного игрового объекта - game.
// И мы знаем, что все объекты в нашей игре должны иметь ширину, высоту, положение по осям x и y.
// Давайте пока установим позицию на ноль в левом верхнем углу игровой зоны.

// Я хочу, чтобы вся сетка врагов прыгала между левым и правым краями игровой зоны.
// И каждый раз, когда волна врагов касается края, она будет подпрыгивать на одну ступеньку ниже, приближаясь к игроку.
// Ширина всей волны из девяти врагов, организованных в три ряда и три колонны, будет такой:
// игра столбцы точек из строки 95 раз эта игра точек Немезида из строки 97.
class Wave {
  // Массив push из Game this.waves.push(new Wave(this)); Здесь он ожидается и преобразуется в это свойство игрового класса. this.game = game;
  // Отсюда у нас есть доступ к столбцам, строкам и размеру противника.
  // Отсюда у нас есть доступ к столбцам, строкам и размеру противника.
  // Теперь я могу взять этот массив точечных волн.
  constructor(game) {
    this.game = game;
    // Ширина всей волны из девяти врагов, организованных в три ряда и три колонны, будет такой:
    this.width = this.game.columns * this.game.enemySize;
    this.height = this.game.columns * this.game.enemySize;
    this.x = 0;
    this.y = -this.height;
    // Вся волна врагов будет двигаться как единое целое, поэтому скорость будет зависеть от объекта волны.
    this.speedX = 3;
    this.speedY = 0;
    // У каждой волны будет свой собственный набор врагов.
    this.enemies = [];
    this.create();
  }

  // Метод Render отрисует и обновит всю волну врагов. Поэтому, как обычно, понадобится контекст.
  render(context) {
    if (this.y < 0) this.y += 5;
    this.speedY = 0;
    // Затем мы воспользуемся этим контекстом, а пока обведем прямоугольник, представляющий всю область волны.
    // Каждая волна будет содержать определенное количество врагов в зависимости от значения строк и столбцов точек.
    // Мы начинаем с трижды по три, так что в первой волне будет девять врагов.
    // Каждый раз, когда мы уничтожаем всех врагов в одной волне, автоматически запускается следующая волна.
    context.strokeRect(this.x, this.y, this.width, this.height);

    // Если X меньше нуля или если X больше ширины игры.
    // Минус ширина волны, что означает, что всякий раз, когда прямоугольник волны касается левого или правого края
    // игровой зоны меняет ее горизонтальную скорость на противоположное значение.
    // Это заставит волну бесконечно подпрыгивать влево и вправо.
    // Вертикальная скорость будет равна нулю всякий раз, когда она касается одного из краев.
    if (this.x < 0 || this.x > this.game.width - this.width) {
      this.speedX *= -1;
      // Я хочу, чтобы он прыгал вертикально вниз по направлению к игроку на размер врага.
      // Когда мы касаемся края таким образом, скорость y остается высокой, и волна продолжает двигаться вниз.
      // Я хочу, чтобы он пролетел мимо Немезиса за один кадр анимации, а затем вернулся к нулевой скорости y.
      this.speedY = this.game.enemySize;
    }
    // Для каждого кадра анимации мы увеличиваем горизонтальное положение на скорость.
    this.x += this.speedX;
    this.y += this.speedY;
    this.enemies.forEach((enemy) => {
      enemy.update(this.x, this.y);
      enemy.draw(context);
    });
    this.enemies = this.enemies.filter(object => !object.markedForDeletions);
  }
  create() {
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let enemyX = x * this.game.enemySize;
        let enemyY = y * this.game.enemySize;
        this.enemies.push(new Enemy(this.game, enemyX, enemyY));
      }
    }
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.keys = [];
    this.player = new Player(this);
    this.projectilesPool = [];
    this.numberOfProjectiles = 10;
    this.createProjectiles();
    console.log(this.projectilesPool);

    // В каждой волне будет группа врагов, организованных в сетку.
    // Первая волна будет представлять собой сетку из девяти врагов, организованных в три столбца и три ряда.
    this.columns = 3;
    this.rows = 3;
    // Мне также нужно, чтобы размер врага, размер каждого отдельного врага был доступен глобально по всему моему
    // кодовой базы, поскольку нам необходимо знать о ней в нескольких местах кода. (this.enemySize)
    // Итак, на данный момент каждый враг будет представлять собой квадрат размером 60 на 60 пикселей.
    this.enemySize = 60;
    // Мы будем хранить все активные волны внутри этого массива точечных волн в основном классе игры сразу же после их создания.
    this.waves = [];
    // new Wave класс игры, первая волна из трех умноженных на три девять врагов будет автоматически создана и вытеснена
    // внутри этого массива точечных волн.
    // Я передаю ему ключевому слову this, чтобы обозначить основной игровой объект, внутри которого мы сейчас находимся. (это Game)
    this.waves.push(new Wave(this));

    window.addEventListener('keydown', (e) => {
      if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key);
      if (e.key === '1') this.player.shoot();
      console.log(this.keys);
    });

    window.addEventListener('keyup', (e) => {
      const index = this.keys.indexOf(e.key);
      if (index > -1) this.keys.splice(index, 1);
      console.log(this.keys);
    });
  }
  render(context) {
    // console.log(this.width, this.height);
    this.player.draw(context);
    this.player.update();

    this.projectilesPool.forEach((projectile) => {
      projectile.update();
      projectile.draw(context);
    });
    // Теперь я могу взять этот массив точечных волн.
    // Мы уже загнали одну волну внутрь, поэтому я вызываю каждую. И для каждого волнового объекта внутри этого массива волн.
    // В настоящее время внутри находится только один. Мы назовем его метод рендеринга. Мы передаем ему контекст.
    this.waves.forEach((wave) => {
      wave.render(context);
    });
  }

  createProjectiles() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectilesPool.push(new Projectile());
    }
  }

  getProjectile() {
    for (let i = 0; i < this.projectilesPool.length; i++) {
      if (this.projectilesPool[i].free) return this.projectilesPool[i];
    }
  }

  checkCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}

window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 800;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 5;

  const game = new Game(canvas);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx);
    requestAnimationFrame(animate);
  }
  animate();
});

console.log();

import { Controller, Get, Render, Post, Session, Redirect, Body } from '@nestjs/common';
import * as mysql from 'mysql2';
import * as crypt from 'bcrypt';
import { AppService } from './app.service';
import UserDto from './user.dto';
import musicDto from './music.dto';


const conn = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'music_streaming',
}).promise();

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Render('index')
  async index(@Session() session: Record<string, any>) {
    let userAct = '';
    const add = document.getElementById('add_button')
    //list
    const [datarow]: any = await conn.execute('SELECT * FROM zeneszamok')
    //login check
    if (session.user_id) {
      const [userrow]: any = await conn.execute('SELECT username FROM users WHERE id = ?', [session.user_id]);
      userAct = userrow[0].username
      add.className = 'btn btn-outline-primary'
    }
    else {
      userAct = 'Guest'
    }
    return { userAct, datarow };
  }

  @Get('/login')
  @Render('login')
  loginRender() {
    return {};
  }

  @Post('/login')
  @Redirect()
  async login(@Body() UserDto: UserDto, @Session() session: Record<string, any>) {
    const [rows]: any = await conn.execute(
      'SELECT id, username, password FROM users WHERE username = ?',
      [UserDto.username],
    );
    if (rows.length == 0) {
      return { url: '/login' };
    }
    if (await crypt.compare(UserDto.password, rows[0].password)) {
      session.user_id = rows[0].id;
      return { url: '/' };
    } else {
      return { url: '/login' };
    }
  }

  @Get('/register')
  @Render('register')
  registerRender() {
    return {};
  }

  @Post('/register')
  @Redirect()
  async register(@Body() UserDto: UserDto) {
    await conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', [UserDto.username,
    await crypt.hash(UserDto.password, 10),
    ]);
    return {
      url: '/'
    };
  }

  @Get('/add')
  @Render('add')
  addRender() {
    return {};
  }

  @Post('/add')
  @Redirect()
  async add(@Body() musicDto: musicDto) {
    await conn.execute('INSERT INTO zeneszamok (title, artist, lenght) VALUES (?, ?, ?)', [
      musicDto.name,
      musicDto.artist,
      musicDto.lenght
    ]);
    return {
      url: '/'
    };
  }
}

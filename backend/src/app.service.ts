import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHelloSquabble(): string {
    return 'Hello Squabble!';
  }
}

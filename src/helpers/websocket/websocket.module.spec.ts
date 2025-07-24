import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketModule } from './websocket.module';
import { WebsocketService } from './websocket.service';

describe('WebsocketModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [WebsocketModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide WebSocketService', () => {
        const webSocketService =
            module.get<WebsocketService<any>>(WebsocketService);
        expect(webSocketService).toBeDefined();
    });
});

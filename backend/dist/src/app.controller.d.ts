export declare class AppController {
    getRoot(): {
        status: string;
        service: string;
        version: string;
        timestamp: string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
    };
}

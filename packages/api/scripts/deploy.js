require('dotenv').config();

const environment = process.argv[2];

if (!environment) {
    console.error('환경을 지정해주세요 (dev, alpha, real)');
    process.exit(1);
}

const configs = {
    dev: {
        apiUrl: 'https://api-dev.example.com',
        region: 'ap-northeast-2'
    },
    alpha: {
        apiUrl: 'https://api-alpha.example.com',
        region: 'ap-northeast-2'
    },
    real: {
        apiUrl: 'https://api.example.com',
        region: 'ap-northeast-2'
    }
};

const config = configs[environment];

if (!config) {
    console.error(`지원하지 않는 환경입니다: ${environment}`);
    process.exit(1);
}

console.log(`배포 환경: ${environment}`);
console.log(`API URL: ${config.apiUrl}`);
console.log(`리전: ${config.region}`);

console.log('배포가 완료되었습니다!'); 
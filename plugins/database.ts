import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();
await client
	.$connect().then(() => console.log('Connected to database.'))
	.catch(() => {
        console.error('Can not connect to database.')
		process.exit(0);
	});

export default client;

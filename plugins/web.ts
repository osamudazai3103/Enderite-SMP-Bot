import express from 'express';
const app = express();

app.get('/', (_, res) => {
	res.send('Enderite SMP is up!');
});
app.listen(3000, () => {
	console.log('Ready!');
});

export default app;

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
	startRemoveExpense,
	startAddExpense,
	addExpense,
	editExpense,
	removeExpense,
	setExpenses,
	startSetExpenses,
	startEditExpense
} from '../../redux/actions/expenses';
import expenses from '../fixtures/testData';
import database from '../../../db/firebase';

const createMockStore = configureMockStore([thunk]);

const uid = 'thisismytestUid';
beforeEach(done => {
	const expensesData = {};
	expenses.forEach(({ id, description, note, amount, createdAt }) => {
		expensesData[id] = { description, note, amount, createdAt };
	});
	database
		.ref(`users/${uid}/expenses`)
		.set(expensesData)
		.then(() => done());
});

test('should setup remove expense action object', () => {
	const action = removeExpense({ id: '123abc' });
	expect(action).toEqual({
		type: 'REMOVE_EXPENSE',
		id: '123abc'
	});
});

test('should remove expense from firebase and store', done => {
	const store = createMockStore({ auth: { uid } });
	const id = expenses[2].id;
	store.dispatch(startRemoveExpense({ id }))
		.then(() => {
			const actions = store.getActions();
			expect(actions[0]).toEqual({
				type: 'REMOVE_EXPENSE',
				id
			});
			return database
				.ref(`users/${uid}/expenses/${id}`)
				.once('value');
		})
		.then(snapshot => {
			expect(snapshot.val()).toBeFalsy();
			done();
		});
});

test('should setup editExpense action object', () => {
	const action = editExpense('123abc', {
		id: 'abc',
		description: 'rent',
		amount: 300
	});
	expect(action).toEqual({
		type: 'EDIT_EXPENSE',
		id: '123abc',
		updates: { id: 'abc', description: 'rent', amount: 300 }
	});
});

test('should edit expense from firebase and store', done => {
	const store = createMockStore({ auth: { uid } });
	const id = expenses[2].id;
	const updates = {
		description: 'him',
		amount: 10,
		createdAt: 5000
	};
	store.dispatch(startEditExpense(id, updates))
		.then(() => {
			const actions = store.getActions();
			expect(actions[0]).toEqual({
				type: 'EDIT_EXPENSE',
				id,
				updates
			});

			return database
				.ref(`users/${uid}/expenses/${id}`)
				.once('value');
		})
		.then(snapshot => {
			expect(snapshot.val().amount).toBe(updates.amount);
			done();
		});
});

test('should setup add Expense action object with provided values', () => {
	const action = addExpense(expenses[2]);
	expect(action).toEqual({
		type: 'ADD_EXPENSE',
		expenses: expenses[2]
	});
});

test('should add expense to database and store', done => {
	const store = createMockStore({ auth: { uid } });
	const expenseData = {
		description: 'Mouse',
		amount: 3000,
		note: 'this one is better',
		createdAt: 5000
	};
	store.dispatch(startAddExpense(expenseData))
		.then(() => {
			const actions = store.getActions();
			expect(actions[0]).toEqual({
				type: 'ADD_EXPENSE',
				expenses: {
					id: expect.any(String),
					...expenseData
				}
			});

			return database
				.ref(`users/${uid}/expenses/${actions[0].expenses.id}`)
				.once('value');
		})
		.then(snapshot => {
			expect(snapshot.val()).toEqual(expenseData);
			done();
		});
});

test('should add expense with defaults to database and store', done => {
	const store = createMockStore({ auth: { uid } });
	const expenseDefault = {
		description: '',
		note: '',
		amount: 0,
		createdAt: 0
	};
	store.dispatch(startAddExpense({}))
		.then(() => {
			const actions = store.getActions();
			expect(actions[0]).toEqual({
				type: 'ADD_EXPENSE',
				expenses: {
					id: expect.any(String),
					...expenseDefault
				}
			});

			return database
				.ref(`users/${uid}/expenses/${actions[0].expenses.id}`)
				.once('value');
		})
		.then(snapshot => {
			expect(snapshot.val()).toEqual(expenseDefault);
			done();
		});
});

test('should setup set expenses action object with data', () => {
	const action = setExpenses(expenses);
	expect(action).toEqual({ type: 'SET_EXPENSES', expenses });
});

test('should fetch the expenses from firebase', done => {
	const store = createMockStore({ auth: { uid } });
	store.dispatch(startSetExpenses()).then(() => {
		const actions = store.getActions();
		expect(actions[0]).toEqual({
			type: 'SET_EXPENSES',
			expenses
		});
		done();
	});
});

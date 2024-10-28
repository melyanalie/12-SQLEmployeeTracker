const inquirer = require('inquirer');
const { Client } = require('pg');

const client = new Client({
    user: 'your_username',
    host: 'localhost',
    database: 'employee_db',
    password: 'your_password',
    port: 5433,
});

client.connect();

async function mainMenu() {
    const { action } = await inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            'Exit'
        ],
    });

    switch (action) {
        case 'View all departments':
            await viewDepartments();
            break;
        case 'View all roles':
            await viewRoles();
            break;
        case 'View all employees':
            await viewEmployees();
            break;
        case 'Add a department':
            await addDepartment();
            break;
        case 'Add a role':
            await addRole();
            break;
        case 'Add an employee':
            await addEmployee();
            break;
        case 'Update an employee role':
            await updateEmployeeRole();
            break;
        case 'Exit':
            client.end();
            return;
    }

    // Show main menu again
    mainMenu();
};

// Function to view all departments
const viewDepartments = async () => {
    const res = await client.query('SELECT * FROM departments');
    console.table(res.rows);
};

// Function to view all roles
const viewRoles = async () => {
    const res = await client.query(`
        SELECT roles.id, roles.title, departments.name AS department, roles.salary 
        FROM roles
        JOIN departments ON roles.department_id = departments.id
    `);
    console.table(res.rows);
};

// Function to view all employees
const viewEmployees = async () => {
    const res = await client.query(`
        SELECT employees.id, employees.first_name, employees.last_name, roles.title, 
        departments.name AS department, roles.salary, 
        (SELECT CONCAT(m.first_name, ' ', m.last_name) FROM employees m WHERE m.id = employees.manager_id) AS manager
        FROM employees
        JOIN roles ON employees.role_id = roles.id
        JOIN departments ON roles.department_id = departments.id
    `);
    console.table(res.rows);
};

// Function to add a department
const addDepartment = async () => {
    const { name } = await inquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'Enter the name of the department:',
    });

    await client.query('INSERT INTO departments (name) VALUES ($1)', [name]);
    console.log(`Department '${name}' added.`);
};

// Function to add a role
const addRole = async () => {
    const departments = await client.query('SELECT * FROM departments');
    const departmentChoices = departments.rows.map(dept => ({ name: dept.name, value: dept.id }));

    const { title, salary, department_id } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'Enter the title of the role:',
        },
        {
            type: 'input',
            name: 'salary',
            message: 'Enter the salary for the role:',
            validate: input => !isNaN(input) || 'Salary must be a number',
        },
        {
            type: 'list',
            name: 'department_id',
            message: 'Select a department for this role:',
            choices: departmentChoices,
        },
    ]);

    await client.query('INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, department_id]);
    console.log(`Role '${title}' added.`);
};

// Function to add an employee
const addEmployee = async () => {
    const roles = await client.query('SELECT * FROM roles');
    const roleChoices = roles.rows.map(role => ({ name: role.title, value: role.id }));

    const managers = await client.query('SELECT * FROM employees');
    const managerChoices = managers.rows.map(manager => ({ name: `${manager.first_name} ${manager.last_name}`, value: manager.id }));

    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
        {
            type: 'input',
            name: 'first_name',
            message: 'Enter the first name of the employee:',
        },
        {
            type: 'input',
            name: 'last_name',
            message: 'Enter the last name of the employee:',
        },
        {
            type: 'list',
            name: 'role_id',
            message: 'Select a role for the employee:',
            choices: roleChoices,
        },
        {
            type: 'list',
            name: 'manager_id',
            message: 'Select a manager for the employee:',
            choices: managerChoices,
            when: () => managerChoices.length > 0,
        },
    ]);

    await client.query('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [first_name, last_name, role_id, manager_id || null]);
    console.log(`Employee '${first_name} ${last_name}' added.`);
};

const updateEmployeeRole = async () => {
    const employees = await client.query('SELECT * FROM employees');
    const employeeChoices = employees.rows.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

    const roles = await client.query('SELECT * FROM roles');
    const roleChoices = roles.rows.map(role => ({ name: role.title, value: role.id }));

    const { employee_id, role_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: 'Select an employee to update their role:',
            choices: employeeChoices,
        },
        {
            type: 'list',
            name: 'role_id',
            message: 'Select a new role for the employee:',
            choices: roleChoices,
        },
    ]);

    await client.query('UPDATE employees SET role_id = $1 WHERE id = $2', [role_id, employee_id]);
    console.log(`Employee's role updated.`);
};

mainMenu();

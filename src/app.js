const inquirer = require('inquirer');
const db = require('../db/db');

async function start() {
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
        ]
    });

    switch (action) {
        case 'View all departments':
            viewDepartments();
            break;
        case 'View all roles':
            viewRoles();
            break;
        case 'View all employees':
            viewEmployees();
            break;
        case 'Add a department':
            addDepartment();
            break;
        case 'Add a role':
            addRole();
            break;
        case 'Add an employee':
            addEmployee();
            break;
        case 'Update an employee role':
            updateEmployeeRole();
            break;
        case 'Exit':
            db.end();
            console.log('Goodbye!');
            return;
    }
}

async function viewDepartments() {
    const res = await db.query('SELECT * FROM departments');
    console.table(res.rows);
    start();
}

async function viewRoles() {
    const res = await db.query(`
        SELECT roles.id, roles.title, roles.salary, departments.name AS department 
        FROM roles
        LEFT JOIN departments ON roles.department_id = departments.id
    `);
    console.table(res.rows);
    start();
}

async function viewEmployees() {
    const res = await db.query(`
        SELECT e.id, e.first_name, e.last_name, roles.title, departments.name AS department, roles.salary, 
               CONCAT(m.first_name, ' ', m.last_name) AS manager
        FROM employees e
        LEFT JOIN roles ON e.role_id = roles.id
        LEFT JOIN departments ON roles.department_id = departments.id
        LEFT JOIN employees m ON e.manager_id = m.id
    `);
    console.table(res.rows);
    start();
}

async function addDepartment() {
    const { name } = await inquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'What is the name of the department?'
    });
    await db.query('INSERT INTO departments (name) VALUES ($1)', [name]);
    console.log(`Added ${name} to the database`);
    start();
}

async function addRole() {
    const departments = await db.query('SELECT * FROM departments');
    const departmentChoices = departments.rows.map(dept => ({
        name: dept.name,
        value: dept.id
    }));
    
    const { title, salary, department_id } = await inquirer.prompt([
        { type: 'input', name: 'title', message: 'What is the name of the role?' },
        { type: 'input', name: 'salary', message: 'What is the salary of the role?' },
        { type: 'list', name: 'department_id', message: 'Which department does the role belong to?', choices: departmentChoices }
    ]);
    
    await db.query('INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, department_id]);
    console.log(`Added ${title} to the database`);
    start();
}

async function addEmployee() {
    const roles = await db.query('SELECT * FROM roles');
    const roleChoices = roles.rows.map(role => ({ name: role.title, value: role.id }));

    const employees = await db.query('SELECT * FROM employees');
    const managerChoices = employees.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));
    managerChoices.unshift({ name: 'None', value: null });

    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
        { type: 'input', name: 'first_name', message: "What is the employee's first name?" },
        { type: 'input', name: 'last_name', message: "What is the employee's last name?" },
        { type: 'list', name: 'role_id', message: "What is the employee's role?", choices: roleChoices },
        { type: 'list', name: 'manager_id', message: "Who is the employee's manager?", choices: managerChoices }
    ]);

    await db.query(
        'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
        [first_name, last_name, role_id, manager_id]
    );
    console.log(`Added ${first_name} ${last_name} to the database`);
    start();
}

async function updateEmployeeRole() {
    const employees = await db.query('SELECT * FROM employees');
    const employeeChoices = employees.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));

    const roles = await db.query('SELECT * FROM roles');
    const roleChoices = roles.rows.map(role => ({ name: role.title, value: role.id }));

    const { employee_id, role_id } = await inquirer.prompt([
        { type: 'list', name: 'employee_id', message: 'Which employee do you want to update?', choices: employeeChoices },
        { type: 'list', name: 'role_id', message: 'What is their new role?', choices: roleChoices }
    ]);

    await db.query('UPDATE employees SET role_id = $1 WHERE id = $2', [role_id, employee_id]);
    console.log("Updated employee's role");
    start();
}

start();

#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateFiles } = require('../lib/generators/fileGenerator');

function detectFramework() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (dependencies['next']) {
    return 'Next.js';
  }
  if (dependencies['react']) {
    return 'React';
  }
  return null;
}

async function main() {
  console.log(chalk.blue('🚀 Welcome to the Auth Service Generator'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Generate authentication files', value: 'generate' },
        { name: 'Remove previously generated files', value: 'remove' },
      ],
    },
  ]);

  if (action === 'generate') {
    await generate();
  } else if (action === 'remove') {
    await remove();
  }
}

async function generate() {
  let framework = detectFramework();
  if (framework) {
    console.log(chalk.green(`Detected framework: ${framework}`));
  }

  const questions = [
    {
      type: 'list',
      name: 'framework',
      message: 'Could not detect framework. Please select one:',
      choices: ['Next.js', 'React'],
      when: () => !framework
    },
    {
      type: 'list',
      name: 'nextjsRouter',
      message: 'Select Next.js router:',
      choices: ['App Router', 'Pages Router'],
      default: 'App Router',
      when: (answers) => (answers.framework || framework) === 'Next.js'
    },
    {
      type: 'input',
      name: 'apiBaseUrl',
      message: 'Enter the base URL of your authentication API:',
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the base URL of your authentication API.';
        }
      }
    },
    {
      type: 'input',
      name: 'appId',
      message: 'Enter your Application ID:',
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter your Application ID.';
        }
      }
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API Key:',
      mask: '*',
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter your API Key.';
        }
      }
    },
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Authentication providers (select all that apply):',
      choices: ['GitHub', 'Google', 'Credentials (email/password)', 'Email Magic Links'],
      default: ['Credentials (email/password)']
    },
    {
      type: 'confirm',
      name: 'generateUI',
      message: 'Generate UI components for login and registration forms?',
      default: true
    },
    {
      type: 'confirm',
      name: 'useTailwind',
      message: 'Style the generated components with Tailwind CSS?',
      default: true,
      when: (answers) => answers.generateUI
    }
  ];

  const answers = await inquirer.prompt(questions);
  // If framework was detected, add it to answers object
  if (framework) {
    answers.framework = framework;
  }

  console.log('\nGenerating files...');
  generateFiles(process.cwd(), answers);

  console.log(chalk.green('\nDone! Next steps:'));
  console.log('1. Import the functions from the generated `lib/auth.js` file into your components.');
  console.log('2. Use the functions to implement your sign-in, sign-up, and other authentication flows.');
  console.log('3. Remember to handle session management (e.g., storing tokens in cookies).');
}

async function remove() {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to remove the generated authentication files? This cannot be undone.',
      default: false,
    },
  ]);

  if (confirm) {
    console.log('\nRemoving files...');
    // We need to detect the framework to know where the files are
    const framework = detectFramework() || 'Next.js'; // Default to Next.js if not detectable
    require('../lib/generators/fileGenerator').removeFiles(process.cwd(), { framework });
    console.log(chalk.green('\nFiles removed successfully.'));
  } else {
    console.log('Operation cancelled.');
  }
}

main().catch(console.error);

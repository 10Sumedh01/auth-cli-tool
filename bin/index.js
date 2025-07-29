#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateFiles } = require('../lib/generators/fileGenerator');

async function detectFramework() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.red('No package.json found in the current directory. Please run this command in a valid project directory.'));
    return null;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (dependencies['next']) {
    console.log(chalk.green('Detected framework: Next.js'));
    return 'Next.js';
  }
  if (dependencies['react']) {
    console.log(chalk.green('Detected framework: React'));
    return 'React';
  }
  if (dependencies['vue']) {
    console.log(chalk.green('Detected framework: Vue.js'));
    return 'Vue.js';
  }
  if (dependencies['@angular/core']) {
    console.log(chalk.green('Detected framework: Angular'));
    return 'Angular';
  }
  
  // Manual selection with confirmation
  console.log(chalk.yellow('Could not automatically detect a framework. Please select one manually.'));
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Which framework are you using?',
      choices: [
        { name: 'Next.js (React framework with SSR)', value: 'Next.js' },
        { name: 'React (JavaScript library)', value: 'React' },
        { name: 'Vue.js (Progressive framework)', value: 'Vue.js' },
        { name: 'Angular (TypeScript framework)', value: 'Angular' },
        { name: 'Other/Custom setup', value: 'Other' }
      ],
      default: 'React'
    },
    {
      type: 'confirm',
      name: 'confirmChoice',
      message: (answers) => `Confirm you want to use ${answers.framework}?`,
      default: true
    }
  ]);

  if (!answers.confirmChoice) {
    console.log(chalk.red('Operation cancelled.'));
    return null;
  }

  return answers.framework;
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
        { name: 'Remove previously generated files', value: 'remove' },// For testing purposes 
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
  let framework = await detectFramework();
  
   if (!framework) {
    console.log(chalk.red('Framework selection was cancelled.'));
    return;
  }
  console.log(chalk.cyan('\n📝 Before proceeding, please:'));
  console.log('1. Visit our authentication service website xyz_auth.com to create an account');
  console.log('2. Create a new application/project');
  console.log('3. Copy down your API credentials\n');
  console.log(chalk.yellow('Once you have your credentials ready, enter them below:'));


  const questions = [
        {
      type: 'list',
      name: 'nextjsRouter',
      message: 'Select Next.js router:',
      choices: ['App Router', 'Pages Router'],
      default: 'App Router',
      // when: (answers) => (answers.framework || framework) === 'Next.js'
      when: () => framework === 'Next.js' // Simplified condition
    },
    //TODO: Remove this when the auth service website is hosted and hard code the baseURLs so user no longer needed to add it manually
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
  answers.framework = framework;

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
    
    const framework = await detectFramework();
    
    // Add this check to handle cancellation
    if (!framework) {
      console.log(chalk.red('Framework detection cancelled. Cannot proceed with file removal.'));
      return;
    }
    
    require('../lib/generators/fileGenerator').removeFiles(process.cwd(), { framework });
    console.log(chalk.green('\nFiles removed successfully.'));
  } else {
    console.log('Operation cancelled.');
  }
}

main().catch(console.error);

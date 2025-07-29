const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function generateFiles(projectDir, answers) {
  const templateDir = path.join(__dirname, '../templates');

  const templateData = {
    apiBaseUrl: answers.apiBaseUrl,
    appId: answers.appId,
    apiKey: answers.apiKey,
    providers: answers.providers,
  };

  let targetDir;
  if (answers.framework === 'Next.js') {
    const srcDir = path.join(projectDir, 'src');
    // Check if a `src` directory exists, which is a common convention in Next.js
    if (fs.existsSync(srcDir) && fs.lstatSync(srcDir).isDirectory()) {
      targetDir = path.join(srcDir, 'lib');
    } else {
      targetDir = path.join(projectDir, 'lib');
    }
  } else if (answers.framework === 'React') {
    // For Create React App, code is typically in `src`. A `lib` subfolder is a good practice.
    targetDir = path.join(projectDir, 'src', 'lib');
  } else {
    // Fallback for other project structures.
    targetDir = path.join(projectDir, 'lib');
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const authTemplatePath = path.join(templateDir, 'javascript/auth.js.template');
  const authTemplate = fs.readFileSync(authTemplatePath, 'utf8');
  const authFileContent = ejs.render(authTemplate, templateData);
  const authFilePath = path.join(targetDir, 'auth.js');

  if (fs.existsSync(authFilePath)) {
    console.warn(`File already exists: ${authFilePath}. Skipping to avoid overwriting your changes.`);
  } else {
    fs.writeFileSync(authFilePath, authFileContent);
    console.log(`Successfully created ${authFilePath}`);
  }

  // --- Generate UI Components ---
  if (answers.generateUI) {
    const uiTargetDir = targetDir.replace('/lib', '/components/auth');
    if (!fs.existsSync(uiTargetDir)) {
      fs.mkdirSync(uiTargetDir, { recursive: true });
    }

    const uiTemplates = ['LoginForm.js.template', 'RegisterForm.js.template', 'AuthButtons.js.template'];
    const uiTemplatePath = answers.useTailwind
      ? path.join(templateDir, 'react', 'tailwind')
      : path.join(templateDir, 'react');

    uiTemplates.forEach(templateFile => {
      const templatePath = path.join(uiTemplatePath, templateFile);
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const renderedContent = ejs.render(templateContent, templateData);

      const outputFileName = templateFile.replace('.template', '');
      const outputFilePath = path.join(uiTargetDir, outputFileName);

      if (fs.existsSync(outputFilePath)) {
        console.warn(`File already exists: ${outputFilePath}. Skipping.`);
      } else {
        fs.writeFileSync(outputFilePath, renderedContent);
        console.log(`Successfully created ${outputFilePath}`);
      }
    });
  }
}

function removeFiles(projectDir, answers) {
  let baseDir;
  if (answers.framework === 'Next.js') {
    const srcDir = path.join(projectDir, 'src');
    if (fs.existsSync(srcDir) && fs.lstatSync(srcDir).isDirectory()) {
      baseDir = srcDir;
    } else {
      baseDir = projectDir;
    }
  } else if (answers.framework === 'React') {
    baseDir = path.join(projectDir, 'src');
  } else {
    baseDir = projectDir;
  }

  const authFilePath = path.join(baseDir, 'lib', 'auth.js');
  const componentsDirPath = path.join(baseDir, 'components', 'auth');

  // Use a helper to safely delete files or directories
  const safeDelete = (itemPath, type = 'file') => {
    if (fs.existsSync(itemPath)) {
      try {
        if (type === 'directory') {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }
        console.log(`Successfully removed ${itemPath}`);
      } catch (err) {
        console.error(`Error removing ${itemPath}:`, err);
      }
    } else {
      console.log(`Skipped: ${itemPath} not found.`);
    }
  };

  safeDelete(authFilePath, 'file');
  safeDelete(componentsDirPath, 'directory');
}

module.exports = { generateFiles, removeFiles };

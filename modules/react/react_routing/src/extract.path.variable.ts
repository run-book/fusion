export function extractVariableNames(template) {
  const variablePattern = /{(\w+)}/g;
  let match;
  let variables = [];

  while (match = variablePattern.exec(template)) {
    variables.push(match[1]);
  }

  return variables;
}
export function composeReturnObjectFromMatch(template, path, variableNames) {
  // Escape all regex characters except for placeholders
  let regexSafeTemplate = template.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  // Replace placeholders in the template with regex groups to capture variable parts
  const regexPattern = regexSafeTemplate.replace(/\\{(\w+)\\}/g, '([^\\/]+)');
  const regex = new RegExp(`^${regexPattern}$`);
  const matches = path.match(regex);

  if (!matches) {
    return null;  // Early return if no matches found
  }

  // Building the return object from captured groups
  return variableNames.reduce((obj, varName, index) => {
    obj[varName] = matches[index + 1];  // capture groups in regex match start at index 1
    return obj;
  }, {});
}

export function extractPathVariables(template, path) {
  const variableNames = extractVariableNames(template);
  return composeReturnObjectFromMatch(template, path, variableNames);
}

import inquirer from 'inquirer';

export async function enterDiscogsUsername() {
    const { discogsUsername } = await inquirer.prompt([
      {
        type: 'input',
        name: 'discogsUsername',
        message: 'Please enter your Discogs username:',
        validate: (input) => input.trim() ? true : 'Please enter your Discogs username.'
      }
    ]);
    return discogsUsername;
  }

export async function enterDiscogsToken() {
  const { discogsToken } = await inquirer.prompt([
    {
      type: 'input',
      name: 'discogsToken',
      message: 'Please enter your Discogs token:',
      validate: (input) => input.trim() ? true : 'Please enter your Discogs token.'
    }
  ]);
  return discogsToken;
}

export async function selectCurrency(currencyChoices) {
  const { currency: selectedSymbol } = await inquirer.prompt([
    {
      type: 'list',
      name: 'currency',
      message: 'Please select your desired currency:',
      choices: currencyChoices,
      default: '$'
    }
  ]);

  return currencyChoices.find(choice => choice.value === selectedSymbol);
}

export async function selectPriceBrackets(selectedCurrencyName) {
  const { brackets } = await inquirer.prompt([
    {
      type: 'input',
      name: 'brackets',
      message: `Enter your desired price brackets (comma-separated, in ${selectedCurrencyName}):`,
      default: '10,25,50,100,250',
      validate: (input) =>
        input.split(',').every(val => !isNaN(parseFloat(val.trim())))
          ? true
          : 'Please enter a comma-separated list of numbers.'
    }
  ]);

  return brackets
    .split(',')
    .map(b => parseFloat(b.trim()))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
}
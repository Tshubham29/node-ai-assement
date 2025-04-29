function parseOpenAIResponse(responseText) {
    console.log('responseText',responseText)
    return responseText
      .split('\n')
      .map(line => line.replace(/^\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0);
  }


  const formatQuestionsResponse = (flatArray) => {
    const formatted = {};
    let currentCategory = '';
  
    flatArray.forEach(item => {
      if (item.endsWith(':')) {
        // It's a category
        currentCategory = item.replace(':', '').trim();
        formatted[currentCategory] = [];
      } else if (currentCategory) {
        // It's a question under the current category
        formatted[currentCategory].push(item);
      }
    });
  
    return formatted;
  };

  module.exports = { parseOpenAIResponse,formatQuestionsResponse };

  
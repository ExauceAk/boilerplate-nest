import EmailSendingConfig from 'src/config/mail.config';

/**
 * Utility class containing various helper methods for common operations.
 */
class OtherUtils {
  /**
   * Regular expression to validate UUID strings.
   */
  private static uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  /** Validates if a string is a valid email. */
  public static isEmailValid = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  /** Checks if a string is a valid UUID. */
  public static isValidUUID = (uuid: string): boolean =>
    this.uuidRegex.test(uuid);

  /** Compares two words for equality, ignoring spaces. */
  public verifyTwoWords = (word1: string, word2: string): boolean =>
    word1.trim() === word2.trim();

  /** Splits a sentence into lowercase keywords. */
  extractKeywords = (sentence: string): string[] =>
    sentence.toLowerCase().split(/\s+/);

  /** Returns a paginated subset of data. */
  paginate(data: any[], page: number, limit: number): any[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  }

  /** Removes duplicate values from an array of strings. */
  removeDuplicatedValue = (values: string[]): string[] => [
    ...new Set(values.map((value) => value.trim())),
  ];

  /** Builds an email template using a template path and variables. */
  buildEmailTemplate = (
    templatePath: string,
    variables: Record<string, any>,
  ): string => EmailSendingConfig.buildEmailTemplate(templatePath, variables);

  /** Capitalizes the first letter of a word. */
  changeFirstLetterToUpperCase = (word: string): string =>
    word.charAt(0).toUpperCase() + word.slice(1);

  /** Generates a random number string of specified length. */
  generateNumber(length: number): string {
    if (length <= 0) return '';

    let number = '';
    for (let i = 0; i < length; i++) {
      number += Math.floor(Math.random() * 10);
    }
    return number;
  }

  /** Generates a random 8-digit number. */
  generate8DigitRandomNumber = (): number =>
    Math.floor(10000000 + Math.random() * 90000000);

  /** Extracts tags enclosed in braces from a message. */
  extractTagsFromMessage(message: string): string[] {
    const regex = /\{(\w+)\}/g;
    const matches = message.match(regex);
    return matches ? matches.map((match) => match.slice(1, -1)) : [];
  }

  /** Replaces tags in a message with corresponding values. */
  replaceTagsInMessage(
    message: string,
    params: { [key: string]: string },
  ): string {
    return message.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
  }

  /**
   * Calculates the relevance score of an item based on the presence of specified keywords.
   */
  calculateRelevance(item: { [key: string]: any }, keywords: string[]): number {
    let relevanceScore = 0;

    const checkValue = (value: any): void => {
      if (typeof value === 'string' || typeof value === 'number') {
        const content = value.toString().toLowerCase();
        keywords.forEach((keyword) => {
          if (content.includes(keyword)) relevanceScore += 1;
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach((nestedValue) => checkValue(nestedValue));
      }
    };

    Object.values(item).forEach((value) => checkValue(value));
    return relevanceScore;
  }

  /**
   * Searches through a dataset to find items relevant to a given sentence.
   */
  searchEngine(sentence: string, data: { [key: string]: any }[]): any[] {
    const keywords = this.extractKeywords(sentence);

    return data
      .map((item) => ({
        item,
        relevanceScore: this.calculateRelevance(item, keywords),
      }))
      .filter(({ relevanceScore }) => relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ item }) => item);
  }

  paginateResultsFromCache(
    results: any[],
    total: number,
    page: number,
    limit: number,
  ): object {
    if (!results || results.length === 0)
      return { data: [], total: 0, page: 0, limit };

    if (!Array.isArray(results)) throw new Error('Expected an array');
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return {
      data: results,
      total: total,
      page: page,
      limit: limit,
    };
  }
}

export default OtherUtils;

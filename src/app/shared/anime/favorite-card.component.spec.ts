import { newsDate } from './favorite-card.component';

describe('newsDate', () => {
  it('drops the time', () => {
    expect(newsDate('Nov 5, 2018 2:27 PM')).toBe('Nov 5, 2018');
  });

  it('handles this year’s dates, which have no year', () => {
    expect(newsDate('Jun 30, 9:26 AM')).toBe('Jun 30');
  });
});

import { CustomPaginatorIntl } from './paginator-intl';

describe('CustomPaginatorIntl', () => {
  const intl = new CustomPaginatorIntl();

  it('arma "Mostrando desde–hasta de total"', () => {
    expect(intl.getRangeLabel(1, 25, 294)).toBe('Mostrando 26–50 de 294');
    expect(intl.getRangeLabel(11, 25, 294)).toBe('Mostrando 276–294 de 294');
  });

  it('sin resultados', () => {
    expect(intl.getRangeLabel(0, 25, 0)).toBe('Sin resultados');
  });
});

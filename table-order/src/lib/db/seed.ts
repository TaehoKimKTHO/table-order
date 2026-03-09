export const SEED_SQL = `
INSERT OR IGNORE INTO store (id, name, store_code) VALUES (1, '테스트 매장', 'store001');

INSERT OR IGNORE INTO category (id, store_id, name, sort_order) VALUES
  (1, 1, '메인 메뉴', 1),
  (2, 1, '사이드 메뉴', 2),
  (3, 1, '음료', 3);

INSERT OR IGNORE INTO menu_item (id, category_id, name, price, description, sort_order) VALUES
  (1, 1, '불고기', 15000, '양념 소불고기', 1),
  (2, 1, '김치찌개', 9000, '돼지고기 김치찌개', 2),
  (3, 1, '된장찌개', 8000, '두부 된장찌개', 3),
  (4, 2, '계란말이', 7000, '치즈 계란말이', 1),
  (5, 2, '감자전', 6000, '바삭한 감자전', 2),
  (6, 3, '콜라', 2000, '코카콜라 355ml', 1),
  (7, 3, '사이다', 2000, '칠성사이다 355ml', 2);

INSERT OR IGNORE INTO restaurant_table (id, store_id, table_number) VALUES
  (1, 1, 1),
  (2, 1, 2),
  (3, 1, 3);
`;

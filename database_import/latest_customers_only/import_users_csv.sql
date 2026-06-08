LOAD DATA LOCAL INFILE 'C:/Users/nkpvt/mahathai/database_import/latest_customers_only/users_import.csv'
IGNORE INTO TABLE users
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(full_name, email, @phone, password, role, @remember_token, @created_at, @last_ordered_on, following_email, following_sms, points_remaining, @updated_at)
SET
  phone = NULLIF(@phone, ''),
  remember_token = NULLIF(@remember_token, ''),
  created_at = NULLIF(@created_at, ''),
  last_ordered_on = NULLIF(@last_ordered_on, ''),
  updated_at = NULLIF(@updated_at, '');

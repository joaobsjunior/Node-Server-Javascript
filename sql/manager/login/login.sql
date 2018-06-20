SELECT
	*
FROM
	administrator
WHERE
	email = '${email}'
	AND password = SHA1(
		MD5('${password}')
	)
-- Message Categories
select * from ms_messagecategories;
delete from ms_messagecategories where id in (3,4);

insert into ms_messagecategories( name, created_at ) 
values('Registration',now());

insert into ms_messagecategories( name, created_at ) 
values('Forgot Password',now());

-- Notification Queue
select * from log_notifications;
truncate table log_notifications;

select * from ms_notificationtemplates;

-- User
select * from ms_users;
delete from ms_users where id > 5;

-- Notification Template
	select * from ms_notificationtemplates;
-- #Forgot Password
	insert into ms_notificationtemplates( name, type, subject, body, category_id, code, status, is_delete, created_at )
	values( 'Forgot Password', 1, 'Lupa password anda?', 
			'Hai <strong>#USER_NAME#</strong>,<br><br>Terima kasih anda telah menghubungi SanQua E-Procurement.<br>
		   Berikut link yang dapat anda kunjungi untuk melakukan perubahan password.<br><br>
		   Terima Kasih<br><br>
		   Salam<br>
		   SanQua E-Procurement', 1, 'FORGOT_PASSWORD', 1, 0, now() );
    
	update ms_notificationtemplates
	set body = 'Hai <strong>#USER_NAME#</strong>,<br><br>Terima kasih anda telah menghubungi SanQua E-Procurement.<br>
		   Klik <a href="#VERIFICATION_LINK#">di sini</a> untuk melakukan perubahan password.<br><br>
		   Terima Kasih<br><br>
		   Salam<br>
		   SanQua E-Procurement'
	where id = 3;

Hai <strong>Peter Susanto</strong>,<br><br>Terima kasih anda telah melakukan registrasi di SanQua E-Procurement.<br>
	   Untuk memudahkan kami verifikasi akun anda, silahkan klik 
	   <a href="http://localhost:8080/procurement/u/verify/ff50ed7a5659859d8e1aa45fc93ef550:aefcf3efea872feca0707dc1c4f4d5670b2bbdd146ae71bfc2b47431525e8f94">di sini</a><br><br>
	   Terima Kasih<br><br>
	   Salam<br>
	   SanQua E-Procurement
	   
Hai <strong>Flavianus Candra Susanto</strong>,<br><br>Terima kasih anda telah melakukan registrasi di SanQua E-Procurement.<br>
	   Untuk memudahkan kami verifikasi akun anda, silahkan klik 
	   <a href="http://localhost:8080/procurement/u/verify/b4df0dde2e0ac6fddfb8e5c6797f2aa1:c81a2e06120ffb44cdd46891f538479ecbf6dd8d5bfad1c8da8fec22497192c3">di sini</a><br><br>
	   Terima Kasih<br><br>
	   Salam<br>
	   SanQua E-Procurement
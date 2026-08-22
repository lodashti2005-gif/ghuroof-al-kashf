-- تصحيح معرّف قضية الشاليه ليطابق ملف القضية بالتطبيق
update public.cases
set id = 'last-night', code = 'K-2291'
where id = 'chalet-case';
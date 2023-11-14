-- The website role may run the enquiry trigger. It still cannot change services.
grant execute on function public.guard_enquiry() to lumen_website;

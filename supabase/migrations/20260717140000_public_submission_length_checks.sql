-- Garde-fous longueur sur les dépôts publics (idées, demandes, questionnaires).
-- Raccourcit d'abord les lignes existantes pour ne pas invalider les données historiques.

-- stock_ideas
update public.stock_ideas
set title = left(title, 200)
where char_length(title) > 200;

update public.stock_ideas
set description = left(description, 5000)
where description is not null and char_length(description) > 5000;

alter table public.stock_ideas
  drop constraint if exists stock_ideas_title_len_check,
  drop constraint if exists stock_ideas_description_len_check;

alter table public.stock_ideas
  add constraint stock_ideas_title_len_check check (char_length(title) <= 200),
  add constraint stock_ideas_description_len_check
    check (description is null or char_length(description) <= 5000);

-- intake_requests
update public.intake_requests set title = left(title, 200) where char_length(title) > 200;
update public.intake_requests
set description = left(description, 5000)
where char_length(description) > 5000;
update public.intake_requests
set requester_name = left(requester_name, 500)
where char_length(requester_name) > 500;
update public.intake_requests
set requester_service = left(requester_service, 500)
where char_length(requester_service) > 500;
update public.intake_requests set company = left(company, 500) where char_length(company) > 500;
update public.intake_requests set concern = left(concern, 5000) where char_length(concern) > 5000;
update public.intake_requests
set support_format = left(support_format, 500)
where char_length(support_format) > 500;
update public.intake_requests set budget = left(budget, 500) where char_length(budget) > 500;
update public.intake_requests
set suggested_domain = left(suggested_domain, 500)
where suggested_domain is not null and char_length(suggested_domain) > 500;
update public.intake_requests
set suggested_assignee = left(suggested_assignee, 500)
where suggested_assignee is not null and char_length(suggested_assignee) > 500;

alter table public.intake_requests
  drop constraint if exists intake_requests_title_len_check,
  drop constraint if exists intake_requests_description_len_check,
  drop constraint if exists intake_requests_requester_name_len_check,
  drop constraint if exists intake_requests_requester_service_len_check,
  drop constraint if exists intake_requests_company_len_check,
  drop constraint if exists intake_requests_concern_len_check,
  drop constraint if exists intake_requests_support_format_len_check,
  drop constraint if exists intake_requests_budget_len_check,
  drop constraint if exists intake_requests_suggested_domain_len_check,
  drop constraint if exists intake_requests_suggested_assignee_len_check;

alter table public.intake_requests
  add constraint intake_requests_title_len_check check (char_length(title) <= 200),
  add constraint intake_requests_description_len_check check (char_length(description) <= 5000),
  add constraint intake_requests_requester_name_len_check check (char_length(requester_name) <= 500),
  add constraint intake_requests_requester_service_len_check check (char_length(requester_service) <= 500),
  add constraint intake_requests_company_len_check check (char_length(company) <= 500),
  add constraint intake_requests_concern_len_check check (char_length(concern) <= 5000),
  add constraint intake_requests_support_format_len_check check (char_length(support_format) <= 500),
  add constraint intake_requests_budget_len_check check (char_length(budget) <= 500),
  add constraint intake_requests_suggested_domain_len_check
    check (suggested_domain is null or char_length(suggested_domain) <= 500),
  add constraint intake_requests_suggested_assignee_len_check
    check (suggested_assignee is null or char_length(suggested_assignee) <= 500);

-- survey_responses
update public.survey_responses
set entity = left(entity, 500)
where entity is not null and char_length(entity) > 500;
update public.survey_responses
set service = left(service, 500)
where service is not null and char_length(service) > 500;
update public.survey_responses
set respondent_name = left(respondent_name, 500)
where respondent_name is not null and char_length(respondent_name) > 500;
update public.survey_responses
set survey_version = left(survey_version, 200)
where char_length(survey_version) > 200;

alter table public.survey_responses
  drop constraint if exists survey_responses_entity_len_check,
  drop constraint if exists survey_responses_service_len_check,
  drop constraint if exists survey_responses_respondent_name_len_check,
  drop constraint if exists survey_responses_survey_version_len_check,
  drop constraint if exists survey_responses_prestations_cardinality_check,
  drop constraint if exists survey_responses_answers_size_check;

alter table public.survey_responses
  add constraint survey_responses_entity_len_check
    check (entity is null or char_length(entity) <= 500),
  add constraint survey_responses_service_len_check
    check (service is null or char_length(service) <= 500),
  add constraint survey_responses_respondent_name_len_check
    check (respondent_name is null or char_length(respondent_name) <= 500),
  add constraint survey_responses_survey_version_len_check check (char_length(survey_version) <= 200),
  add constraint survey_responses_prestations_cardinality_check
    check (coalesce(array_length(prestations, 1), 0) <= 50),
  add constraint survey_responses_answers_size_check
    check (octet_length(answers::text) <= 131072);

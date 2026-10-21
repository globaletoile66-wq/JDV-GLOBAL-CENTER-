-- Allow the visual editor to persist bounded, validated design rules and custom blocks.
-- Existing RLS policies continue to restrict writes to authorized Studio administrators.
create or replace function public.jdv_studio_settings_guard_config()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  key_name text;
  path_entry record;
  rule_entry jsonb;
  block_entry jsonb;
  style_entry record;
begin
  if jsonb_typeof(new.config) <> 'object' then
    raise exception 'Studio config must be a JSON object';
  end if;

  for key_name in select jsonb_object_keys(new.config) loop
    if key_name not in ('theme','design','designEditor') then
      raise exception 'Unsupported public Studio config key: %', key_name;
    end if;
  end loop;

  if new.config ? 'theme' then
    if jsonb_typeof(new.config->'theme') <> 'object' then
      raise exception 'Studio theme must be a JSON object';
    end if;
    for key_name in select jsonb_object_keys(new.config->'theme') loop
      if key_name not in ('primary','accent') then
        raise exception 'Unsupported public Studio theme key: %', key_name;
      end if;
    end loop;
    if coalesce(new.config->'theme'->>'primary','') !~ '^#[0-9A-Fa-f]{6}$'
       or coalesce(new.config->'theme'->>'accent','') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Studio theme colors must be six-digit hex values';
    end if;
  end if;

  if new.config ? 'design' then
    if jsonb_typeof(new.config->'design') <> 'object' then
      raise exception 'Studio design must be a JSON object';
    end if;
    for key_name in select jsonb_object_keys(new.config->'design') loop
      if key_name not in ('font','radius','density','cardStyle','showMedia','showHighlights','showAnimations','imageUrl','videoUrl','imageData','videoData') then
        raise exception 'Unsupported public Studio design key: %', key_name;
      end if;
    end loop;
    if coalesce(new.config->'design'->>'imageData','') <> ''
       or coalesce(new.config->'design'->>'videoData','') <> '' then
      raise exception 'Raw media data cannot be stored in public Studio settings';
    end if;
  end if;

  if new.config ? 'designEditor' then
    if jsonb_typeof(new.config->'designEditor') <> 'object' then
      raise exception 'Studio editor config must be a JSON object';
    end if;
    for key_name in select jsonb_object_keys(new.config->'designEditor') loop
      if key_name not in ('rulesByPath','blocksByPath','updatedAt','updatedBy') then
        raise exception 'Unsupported Studio editor config key: %', key_name;
      end if;
    end loop;

    if new.config->'designEditor' ? 'updatedAt'
       and jsonb_typeof(new.config->'designEditor'->'updatedAt') <> 'string' then
      raise exception 'Studio editor updatedAt must be a string';
    end if;
    if new.config->'designEditor' ? 'updatedBy'
       and jsonb_typeof(new.config->'designEditor'->'updatedBy') <> 'string' then
      raise exception 'Studio editor updatedBy must be a string';
    end if;

    if new.config->'designEditor' ? 'rulesByPath' then
      if jsonb_typeof(new.config->'designEditor'->'rulesByPath') <> 'object' then
        raise exception 'Studio rulesByPath must be a JSON object';
      end if;
      for path_entry in select key, value from jsonb_each(new.config->'designEditor'->'rulesByPath') loop
        if length(path_entry.key) > 200 or jsonb_typeof(path_entry.value) <> 'array' or jsonb_array_length(path_entry.value) > 300 then
          raise exception 'Invalid Studio rules list for path';
        end if;
        for rule_entry in select value from jsonb_array_elements(path_entry.value) as item(value) loop
          if jsonb_typeof(rule_entry) <> 'object' then
            raise exception 'Each Studio rule must be a JSON object';
          end if;
          for key_name in select jsonb_object_keys(rule_entry) loop
            if key_name not in ('selector','styles','text','blockId') then
              raise exception 'Unsupported Studio rule key: %', key_name;
            end if;
          end loop;
          if jsonb_typeof(rule_entry->'selector') <> 'string' or length(coalesce(rule_entry->>'selector','')) < 1 or length(rule_entry->>'selector') > 512 then
            raise exception 'Studio rule selector is invalid';
          end if;
          if jsonb_typeof(rule_entry->'styles') <> 'object' then
            raise exception 'Studio rule styles must be a JSON object';
          end if;
          if rule_entry ? 'text' and (jsonb_typeof(rule_entry->'text') <> 'string' or length(rule_entry->>'text') > 500) then
            raise exception 'Studio rule text must be a string of at most 500 characters';
          end if;
          if rule_entry ? 'blockId' and (jsonb_typeof(rule_entry->'blockId') <> 'string' or length(rule_entry->>'blockId') > 100) then
            raise exception 'Studio rule blockId is invalid';
          end if;
          for style_entry in select key, value from jsonb_each(rule_entry->'styles') loop
            if style_entry.key !~ '^[a-z-]+$' or jsonb_typeof(style_entry.value) <> 'string' or length(style_entry.value #>> '{}') > 500 or (style_entry.value #>> '{}') ~ '[{};]' then
              raise exception 'Invalid Studio style declaration';
            end if;
          end loop;
        end loop;
      end loop;
    end if;

    if new.config->'designEditor' ? 'blocksByPath' then
      if jsonb_typeof(new.config->'designEditor'->'blocksByPath') <> 'object' then
        raise exception 'Studio blocksByPath must be a JSON object';
      end if;
      for path_entry in select key, value from jsonb_each(new.config->'designEditor'->'blocksByPath') loop
        if length(path_entry.key) > 200 or jsonb_typeof(path_entry.value) <> 'array' or jsonb_array_length(path_entry.value) > 100 then
          raise exception 'Invalid Studio blocks list for path';
        end if;
        for block_entry in select value from jsonb_array_elements(path_entry.value) as item(value) loop
          if jsonb_typeof(block_entry) <> 'object' then
            raise exception 'Each Studio block must be a JSON object';
          end if;
          for key_name in select jsonb_object_keys(block_entry) loop
            if key_name not in ('id','kind','text') then
              raise exception 'Unsupported Studio block key: %', key_name;
            end if;
          end loop;
          if jsonb_typeof(block_entry->'id') <> 'string' or length(coalesce(block_entry->>'id','')) < 1 or length(block_entry->>'id') > 100 then
            raise exception 'Studio block id is invalid';
          end if;
          if jsonb_typeof(block_entry->'kind') <> 'string' or block_entry->>'kind' not in ('section','text','button','card') then
            raise exception 'Unsupported Studio block kind';
          end if;
          if jsonb_typeof(block_entry->'text') <> 'string' or length(block_entry->>'text') > 500 then
            raise exception 'Studio block text must be a string of at most 500 characters';
          end if;
        end loop;
      end loop;
    end if;
  end if;

  return new;
end;
$$;

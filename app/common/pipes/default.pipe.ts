import { Pipe, PipeTransform } from '@angular/core';

/*
 * Default to a value if undefined
 */
@Pipe({name: 'default'})
export class DefaultPipe implements PipeTransform {
  transform(value: any, defaultValue: any): String {
    return value === undefined ? defaultValue : value;
  }
}

import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { SortPropDir } from '@swimlane/ngx-datatable';
import { BehaviorSubject } from 'rxjs';

import { objectIsEmpty, SCENARIO_CREATE, SCENARIO_UPDATE } from 'app/common';
import { CategoryStore } from 'app/stores';
import { Category, CategorySearch, DatatablePage } from 'app/models';
import { CategorySearchDialogComponent } from './category-search-dialog.component';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import { CategoryDeletionDialogComponent } from './category-deletion-dialog.component';

@Component({
  templateUrl: './category.component.html'
})
export class CategoryComponent implements OnInit {

  readonly loading: BehaviorSubject<boolean>;
  readonly rows: BehaviorSubject<Category[]>;
  readonly page: BehaviorSubject<DatatablePage>;
  readonly sorts: BehaviorSubject<SortPropDir[]>;
  readonly searchModel: BehaviorSubject<CategorySearch>;
  currModel: Category | undefined = undefined;

  constructor(
    private categoryStore: CategoryStore,
    private dialog: MatDialog
  ) {
    this.loading = categoryStore.loading;
    this.rows = categoryStore.items;
    this.page = categoryStore.page;
    this.sorts = categoryStore.sorts;
    this.searchModel = categoryStore.search;
  }

  ngOnInit(): void {
    this.categoryStore.fetchData();
  }

  get hasSearch(): boolean {
    return !objectIsEmpty(this.searchModel.value);
  }

  openMenu(model: Category): void {
    this.currModel = model;
  }

  setPage(page: DatatablePage): void {
    this.categoryStore.page.next(page);
    this.categoryStore.fetchData();
  }

  setSorts(sorts: SortPropDir[]): void {

    /**
     * `DataTableComponent` sets offset to 0 in `onColumnSort` method when sort is applied.
     * @see https://github.com/swimlane/ngx-datatable/issues/765
     */
    const page = { ...this.page.value } as DatatablePage;
    page.offset = 0;
    this.categoryStore.page.next(page);

    this.categoryStore.sorts.next(sorts);
    this.categoryStore.fetchData();
  }

  search(): void {
    const dialogRef = this.openSearchDialog({
      model: this.searchModel.value,
      callback: (model: CategorySearch): void => {
        this.categoryStore.search.next(model);
        this.categoryStore.fetchData();
        dialogRef.close();
      }
    });
  }

  createCategory(): void {
    const dialogRef = this.openFormDialog({
      title: 'Create Category',
      model: new Category(),
      scenario: SCENARIO_CREATE,
      callback: (): void => {
        this.categoryStore.fetchData();
        dialogRef.close();
      }
    });
  }

  viewCategory(model: Category): void {
    this.openFormDialog({
      title: 'View Category',
      model
    });
  }

  updateCategory(model: Category): void {
    const dialogRef = this.openFormDialog({
      title: 'Update Category',
      model,
      scenario: SCENARIO_UPDATE,
      callback: (): void => {
        this.categoryStore.fetchData();
        dialogRef.close();
      }
    });
  }

  deleteCategory(model: Category): void {
    const dialogRef = this.openDeletionDialog({
      model,
      callback: (): void => {
        this.categoryStore.fetchData();
        dialogRef.close();
      }
    });
  }

  openFormDialog(data: any): MatDialogRef<CategoryFormDialogComponent> {
    return this.dialog.open(CategoryFormDialogComponent, { data });
  }

  openDeletionDialog(data: any): MatDialogRef<CategoryDeletionDialogComponent> {
    return this.dialog.open(CategoryDeletionDialogComponent, { data });
  }

  openSearchDialog(data: any): MatDialogRef<CategorySearchDialogComponent> {
    return this.dialog.open(CategorySearchDialogComponent, { data });
  }
}

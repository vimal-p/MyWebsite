import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { SortPropDir } from '@swimlane/ngx-datatable';
import { BehaviorSubject } from 'rxjs';

import { objectIsEmpty } from 'app/common';
import { CategoryStore, PostStore } from 'app/stores';
import { Category, Post, PostSearch, DatatablePage } from 'app/models';
import { PostSearchDialogComponent } from './post-search-dialog.component';
import { PostDeletionDialogComponent } from './post-deletion-dialog.component';

@Component({
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {

  readonly loading: BehaviorSubject<boolean>;
  readonly rows: BehaviorSubject<Post[]>;
  readonly page: BehaviorSubject<DatatablePage>;
  readonly sorts: BehaviorSubject<SortPropDir[]>;
  readonly searchModel: BehaviorSubject<PostSearch>;
  currModel: Post | undefined = undefined;

  constructor(
    private categoryStore: CategoryStore,
    private postStore: PostStore,
    private dialog: MatDialog
  ) {
    this.loading = postStore.loading;
    this.rows = postStore.items;
    this.page = postStore.page;
    this.sorts = postStore.sorts;
    this.searchModel = postStore.search;
  }

  ngOnInit(): void {
    this.categoryStore.fetchAll();
    this.postStore.fetchData();
  }

  get hasSearch(): boolean {
    return !objectIsEmpty(this.searchModel.value);
  }

  getCategoryLabel(id: string): string {
    const model: Category | undefined = this.categoryStore.findById(id);
    return model ? model.name : id;
  }

  openMenu(model: Post): void {
    this.currModel = model;
  }

  setPage(page: DatatablePage): void {
    this.postStore.page.next(page);
    this.postStore.fetchData();
  }

  setSorts(sorts: SortPropDir[]): void {

    /**
     * `DataTableComponent` sets offset to 0 in `onColumnSort` method when sort is applied.
     * @see https://github.com/swimlane/ngx-datatable/issues/765
     */
    const page = { ...this.page.value } as DatatablePage;
    page.offset = 0;
    this.postStore.page.next(page);

    this.postStore.sorts.next(sorts);
    this.postStore.fetchData();
  }

  search(): void {
    const dialogRef = this.openSearchDialog({
      model: this.searchModel.value,
      callback: (model: PostSearch): void => {
        this.postStore.search.next(model);
        this.postStore.fetchData();
        dialogRef.close();
      }
    });
  }

  deletePost(model: Post): void {
    const dialogRef = this.openDeletionDialog({
      model,
      callback: (): void => {
        this.postStore.fetchData();
        dialogRef.close();
      }
    });
  }

  openDeletionDialog(data: any): MatDialogRef<PostDeletionDialogComponent> {
    return this.dialog.open(PostDeletionDialogComponent, { data });
  }

  openSearchDialog(data: any): MatDialogRef<PostSearchDialogComponent> {
    return this.dialog.open(PostSearchDialogComponent, { data });
  }
}
